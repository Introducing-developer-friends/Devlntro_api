import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import {
  ContactListResult,
  ContactDetailResult,
  ContactRequestResult,
  ReceivedRequestResult,
  SentRequestResult,
} from '../types/contacts.types';
import { ErrorMessageType } from '../enums/error.message.enum';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(BusinessContact)
    private readonly contactRepository: Repository<BusinessContact>,
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,

    @InjectRepository(FriendRequest)
    private readonly friendRequestRepository: Repository<FriendRequest>,
    private readonly dataSource: DataSource,
  ) {}

  async getContactList(userId: number): Promise<ContactListResult[]> {
    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .select([
        'contact.contact_id',
        'userAccount.user_id',
        'userAccount.name',
        'contact_user.user_id',
        'contact_user.name',
        'userProfile.company',
        'userProfile.department',
        'contactProfile.company',
        'contactProfile.department',
      ])
      .leftJoin('contact.userAccount', 'userAccount')
      .leftJoin('contact.contact_user', 'contact_user')
      .leftJoin('userAccount.profile', 'userProfile')
      .leftJoin('contact_user.profile', 'contactProfile')
      .where(
        '(contact.userAccount.user_id = :userId OR contact.contact_user.user_id = :userId)',
        { userId },
      )
      .andWhere('contact.deleted_at IS NULL')
      .andWhere('userAccount.deletedAt IS NULL')
      .andWhere('contact_user.deletedAt IS NULL')
      .getMany();

    return contacts.map((contact) => {
      const contactUser =
        contact.userAccount.user_id === userId
          ? contact.contact_user
          : contact.userAccount;

      return {
        userId: contactUser.user_id,
        name: contactUser.name,
        company: contactUser.profile?.company || 'N/A',
        department: contactUser.profile?.department || 'N/A',
      };
    });
  }

  async getContactDetail(
    requesterId: number,
    targetUserId: number,
  ): Promise<ContactDetailResult> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .select([
        'user.user_id',
        'user.name',
        'profile.company',
        'profile.department',
        'profile.position',
        'profile.email',
        'profile.phone',
      ])
      .where('user.user_id = :targetUserId', { targetUserId })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    if (!result) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_CONTACT);
    }

    return {
      userId: result.user_id,
      name: result.name,
      company: result.profile?.company || 'N/A',
      department: result.profile?.department || 'N/A',
      position: result.profile?.position || 'N/A',
      email: result.profile?.email || 'N/A',
      phone: result.profile?.phone || 'N/A',
    };
  }

  async addContactRequest(
    userId: number,
    contactLoginId: string,
  ): Promise<ContactRequestResult> {
    const [user, contactUser] = await Promise.all([
      this.userRepository.findOne({
        where: { user_id: userId, deletedAt: null },
      }),
      this.userRepository.findOne({
        where: { login_id: contactLoginId, deletedAt: null },
      }),
    ]);

    if (!user || !contactUser) {
      throw new BadRequestException(ErrorMessageType.TARGET_USER_NOT_FOUND);
    }

    if (user.user_id === contactUser.user_id) {
      throw new BadRequestException(ErrorMessageType.SELF_REQUEST_NOT_ALLOWED);
    }

    const [existingRequest, existingContact] = await Promise.all([
      this.friendRequestRepository.findOne({
        where: [
          {
            sender: { user_id: userId },
            receiver: { user_id: contactUser.user_id },
            status: 'pending',
          },
          {
            sender: { user_id: contactUser.user_id },
            receiver: { user_id: userId },
            status: 'pending',
          },
        ],
      }),
      this.contactRepository.findOne({
        where: {
          userAccount: { user_id: userId },
          contact_user: { user_id: contactUser.user_id },
        },
      }),
    ]);

    if (existingRequest)
      throw new ConflictException('이미 인맥 요청을 보냈거나 받았습니다.');
    if (existingContact)
      throw new ConflictException(ErrorMessageType.CONTACT_ALREADY_EXISTS);

    const newRequest = await this.friendRequestRepository.save({
      sender: user,
      receiver: contactUser,
      status: 'pending',
    });

    return { requestId: newRequest.request_id };
  }

  async acceptContactRequest(userId: number, requestId: number): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const request = await transactionalEntityManager.findOne(FriendRequest, {
        where: {
          request_id: requestId,
          receiver: { user_id: userId },
          status: 'pending',
        },
        relations: ['sender', 'receiver'],
      });

      if (!request) {
        throw new NotFoundException(ErrorMessageType.NOT_FOUND_REQUEST);
      }

      const existingContact = await transactionalEntityManager.findOne(
        BusinessContact,
        {
          where: [
            {
              userAccount: { user_id: request.receiver.user_id },
              contact_user: { user_id: request.sender.user_id },
            },
            {
              userAccount: { user_id: request.sender.user_id },
              contact_user: { user_id: request.receiver.user_id },
            },
          ],
        },
      );

      if (!existingContact) {
        const contact = transactionalEntityManager.create(BusinessContact, {
          userAccount: request.receiver,
          contact_user: request.sender,
        });
        await transactionalEntityManager.save(contact);
      }

      request.status = 'accepted';
      await transactionalEntityManager.save(request);
    });
  }

  async rejectContactRequest(userId: number, requestId: number): Promise<void> {
    const request = await this.friendRequestRepository.findOne({
      where: {
        request_id: requestId,
        receiver: { user_id: userId },
        status: 'pending',
      },
    });

    if (!request) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_REQUEST);
    }

    await this.friendRequestRepository.save({
      ...request,
      status: 'rejected',
    });
  }

  async getReceivedRequests(userId: number): Promise<ReceivedRequestResult[]> {
    const requests = await this.friendRequestRepository
      .createQueryBuilder('request')
      .select([
        'request.request_id',
        'request.created_at',
        'sender.login_id',
        'sender.name',
      ])
      .leftJoin('request.sender', 'sender')
      .where('request.receiver.user_id = :userId', { userId })
      .andWhere('request.status = :status', { status: 'pending' })
      .andWhere('sender.deletedAt IS NULL')
      .orderBy('request.created_at', 'DESC')
      .getMany();

    return requests.map((req) => ({
      requestId: req.request_id,
      senderLoginId: req.sender.login_id,
      senderName: req.sender.name,
      requestedAt: req.created_at,
    }));
  }

  async getSentRequests(userId: number): Promise<SentRequestResult[]> {
    const requests = await this.friendRequestRepository
      .createQueryBuilder('request')
      .select([
        'request.request_id',
        'request.created_at',
        'receiver.login_id',
        'receiver.name',
      ])
      .leftJoin('request.receiver', 'receiver')
      .where('request.sender.user_id = :userId', { userId })
      .andWhere('request.status = :status', { status: 'pending' })
      .andWhere('receiver.deletedAt IS NULL')
      .orderBy('request.created_at', 'DESC')
      .getMany();

    return requests.map((req) => ({
      requestId: req.request_id,
      receiverLoginId: req.receiver.login_id,
      receiverName: req.receiver.name,
      requestedAt: req.created_at,
    }));
  }

  async deleteContact(userId: number, contactUserId: number): Promise<void> {
    const contact = await this.contactRepository.findOne({
      where: [
        {
          userAccount: { user_id: userId },
          contact_user: { user_id: contactUserId },
          deleted_at: null,
        },
        {
          userAccount: { user_id: contactUserId },
          contact_user: { user_id: userId },
          deleted_at: null,
        },
      ],
      relations: ['userAccount', 'contact_user'],
    });

    if (!contact) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_CONTACT);
    }

    await this.contactRepository.softRemove(contact);
  }
}
