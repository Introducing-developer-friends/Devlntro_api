import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource  } from 'typeorm';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import {
  ContactListResult,
  ContactDetailResult,
  ContactRequestResult,
  ReceivedRequestResult,
  SentRequestResult
} from '../types/contacts.types';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(BusinessContact)
    private readonly  contactRepository: Repository<BusinessContact>,
    @InjectRepository(UserAccount)
    private readonly  userRepository: Repository<UserAccount>,
    @InjectRepository(BusinessProfile)
    private readonly  profileRepository: Repository<BusinessProfile>,
    @InjectRepository(FriendRequest)
    private readonly  friendRequestRepository: Repository<FriendRequest>,
    private readonly  dataSource: DataSource
  ) {}

  // 사용자의 인맥 목록을 조회하는 메서드
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
        'contactProfile.department'
      ])
      .leftJoin('contact.userAccount', 'userAccount')
      .leftJoin('contact.contact_user', 'contact_user')
      .leftJoin('userAccount.profile', 'userProfile')
      .leftJoin('contact_user.profile', 'contactProfile')
      .where('(contact.userAccount.user_id = :userId OR contact.contact_user.user_id = :userId)', { userId })
      .andWhere('contact.deleted_at IS NULL')
      .andWhere('userAccount.deletedAt IS NULL')
      .andWhere('contact_user.deletedAt IS NULL')
      .getMany();
  
    // 빈 배열 반환이 아닌 정상적인 처리
    return contacts.map((contact) => {
      const contactUser = contact.userAccount.user_id === userId
        ? contact.contact_user
        : contact.userAccount;
      const profile = contact.userAccount.user_id === userId
        ? contact.contact_user.profile
        : contact.userAccount.profile;

    return {
      userId: contactUser.user_id,
      name: contactUser.name,
      company: contactUser.profile?.company || 'N/A',
      department: contactUser.profile?.department || 'N/A'
    };
  });
}

  // 특정 사용자의 명함 상세 정보를 조회하는 메서드
  async getContactDetail(requesterId: number, targetUserId: number): Promise<ContactDetailResult> {
      
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
        'profile.phone'
      ])
      .where('user.user_id = :targetUserId', { targetUserId })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

      if (!result) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }
      
      // 명함 상세 정보를 반환 (profile이 없을 경우 기본값으로 N/A 사용)
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
  
  // 새로운 인맥을 추가하는 메서드
  async addContactRequest(userId: number, contactLoginId: string): Promise<ContactRequestResult> {

    const [user, contactUser] = await Promise.all([
      this.userRepository.findOne({ where: { user_id: userId, deletedAt: null}}),
      this.userRepository.findOne( { where: { login_id: contactLoginId, deletedAt: null}})
    ]);

    if (!user || !contactUser) {
      throw new BadRequestException('대상 사용자를 찾을 수 없습니다.');
    }

    if (user.user_id === contactUser.user_id) {
      throw new BadRequestException('자기 자신에게 요청을 보낼 수 없습니다.');
    }

    const [existingRequest, existingContact] = await Promise.all([
      this.friendRequestRepository.findOne({
        where: [
          { sender: { user_id: userId}, receiver: { user_id: contactUser.user_id }, status: 'pending'},
          { sender: { user_id: contactUser.user_id }, receiver: { user_id:userId }, status: 'pending' }
        ]
      }),
      this.contactRepository.findOne({
        where: {
          userAccount: { user_id: userId},
          contact_user: { user_id: contactUser.user_id}
        }
      })
    ]);

    if (existingRequest) throw new ConflictException('이미 인맥 요청을 보냈거나 받았습니다.');
    if (existingContact) throw new ConflictException('이미 인맥 관계가 존재합니다.');

    const newRequest  = await this.friendRequestRepository.save({
      sender: user,
      receiver: contactUser,
      status: 'pending'
    });

    return {requestId: newRequest.request_id };

  }

  // 인맥 요청을 수락하는 메서드
  async acceptContactRequest(userId: number, requestId: number): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const request = await transactionalEntityManager.findOne(FriendRequest, {
        where: { 
          request_id: requestId, 
          receiver: { user_id: userId },
          status: 'pending' 
        },
        relations: ['sender', 'receiver']
      });
  
      if (!request) {
        throw new NotFoundException('해당 인맥 요청을 찾을 수 없습니다.');
      }
  
      // 이미 존재하는 관계인지 확인
      const existingContact = await transactionalEntityManager.findOne(BusinessContact, {
        where: [
          { 
            userAccount: { user_id: request.receiver.user_id },
            contact_user: { user_id: request.sender.user_id }
          },
          { 
            userAccount: { user_id: request.sender.user_id },
            contact_user: { user_id: request.receiver.user_id }
          }
        ]
      });
  
      if (!existingContact) {
        // 양방향 인맥 관계 생성
        const contact = transactionalEntityManager.create(BusinessContact, {
          userAccount: request.receiver,
          contact_user: request.sender
        });
        await transactionalEntityManager.save(contact);
      }

      // 요청 상태를 수락으로 변경
      request.status = 'accepted';
      await transactionalEntityManager.save(request);
    });
  }

  // 인맥 요청을 거절하는 메서드
  async rejectContactRequest(userId: number, requestId: number): Promise<void> {

      const request = await this.friendRequestRepository.findOne({
        where: { 
          request_id: requestId, 
          receiver: { user_id: userId },
          status: 'pending' 
        }
      });

    // 요청을 찾지 못했을 경우 예외를 발생
    if (!request) {
      throw new NotFoundException('해당 인맥 요청을 찾을 수 없습니다.');
    }

    // 요청 상태를 거절로 변경하고 저장
    await this.friendRequestRepository.save({
      ...request,
      status: 'rejected'
    });


  }

  // 받은 인맥 요청 목록을 조회하는 메서드
  async getReceivedRequests(userId: number): Promise<ReceivedRequestResult[]> {
    const requests = await this.friendRequestRepository
      .createQueryBuilder('request')
      .select([
        'request.request_id',
        'request.created_at',
        'sender.login_id',
        'sender.name'
      ])
      .leftJoin('request.sender', 'sender')
      .where('request.receiver.user_id = :userId', { userId })
      .andWhere('request.status = :status', { status: 'pending' })
      .andWhere('sender.deletedAt IS NULL')
      .orderBy('request.created_at', 'DESC')
      .getMany();
   
    return requests.map(req => ({
      requestId: req.request_id,
      senderLoginId: req.sender.login_id,
      senderName: req.sender.name,
      requestedAt: req.created_at
    }));
   }

  // 보낸 인맥 요청 목록을 조회하는 메서드
  async getSentRequests(userId: number): Promise<SentRequestResult[]> {
    const requests = await this.friendRequestRepository
      .createQueryBuilder('request')
      .select([
        'request.request_id',
        'request.created_at',
        'receiver.login_id', 
        'receiver.name'
      ])
      .leftJoin('request.receiver', 'receiver')
      .where('request.sender.user_id = :userId', { userId })
      .andWhere('request.status = :status', { status: 'pending' })
      .andWhere('receiver.deletedAt IS NULL')
      .orderBy('request.created_at', 'DESC')
      .getMany();
   
    return requests.map(req => ({
      requestId: req.request_id,
      receiverLoginId: req.receiver.login_id,
      receiverName: req.receiver.name, 
      requestedAt: req.created_at
    }));
   }

  // 기존 인맥을 제거하는 메서드
  async deleteContact(userId: number, contactUserId: number): Promise<void> {

     // 양방향 관계 모두 체크 (userAccount <-> contact_user)
    const contact = await this.contactRepository.findOne({
      where: [
        {  // 내가 userAccount인 경우
          userAccount: { user_id: userId },
          contact_user: { user_id: contactUserId },
          deleted_at: null
        },
        {  // 내가 contact_user인 경우
          userAccount: { user_id: contactUserId },
          contact_user: { user_id: userId },
          deleted_at: null
        }
      ],
      relations: ['userAccount', 'contact_user']
    });
  
      if (!contact) {
        throw new NotFoundException('해당 인맥을 찾을 수 없습니다.');
      }
  
    // 특정 관계만 삭제
    await this.contactRepository.softRemove(contact);
  }
}