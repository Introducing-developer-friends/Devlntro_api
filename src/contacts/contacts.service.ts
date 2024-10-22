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
    // userId가 userAccount or contact_user인 모든 관계를 조회
    const contacts = await this.contactRepository
    .createQueryBuilder('contact')
    .leftJoinAndSelect('contact.userAccount', 'userAccount')
    .leftJoinAndSelect('contact.contact_user', 'contact_user')
    .leftJoinAndSelect('userAccount.profile', 'userProfile')
    .leftJoinAndSelect('contact_user.profile', 'contactProfile')
    .where('(contact.userAccount.user_id = :userId OR contact.contact_user.user_id = :userId)')
    .andWhere('contact.deleted_at IS NULL')
    .andWhere('userAccount.deletedAt IS NULL')
    .andWhere('contact_user.deletedAt IS NULL')
    .setParameter('userId', userId)
    .getMany();
  
    // 빈 배열 반환이 아닌 정상적인 처리
  return contacts.map((contact) => {
    const contactUser = contact.userAccount.user_id === userId
      ? contact.contact_user
      : contact.userAccount;

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
      // targetUserId에 해당하는 사용자의 정보를 조회
      const user = await this.userRepository.findOne({
        where: { user_id: targetUserId },
        relations: ['profile'], // 사용자와 연결된 profile 정보도 함께 조회
      });
  
      if (!user) {
        console.log(`User not found for user_id: ${targetUserId}`);
        throw new NotFoundException('사용자를 찾을 수 없습니다.'); // 사용자가 없으면 예외 발생
      }
      
      // 명함 상세 정보를 반환 (profile이 없을 경우 기본값으로 N/A 사용)
      return {
        userId: user.user_id,
        name: user.name,
        company: user.profile?.company || 'N/A',
        department: user.profile?.department || 'N/A',
        position: user.profile?.position || 'N/A',
        email: user.profile?.email || 'N/A',
        phone: user.profile?.phone || 'N/A',
      };
    }
  
  // 새로운 인맥을 추가하는 메서드
  async addContactRequest(userId: number, contactLoginId: string): Promise<ContactRequestResult> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
    // 요청을 보낸 사용자와 요청을 받는 사용자를 데이터베이스에서 조회.
    const user = await transactionalEntityManager.findOne(UserAccount, { where: { user_id: userId, deletedAt: null } });
    const contactUser = await transactionalEntityManager.findOne(UserAccount, { where: { login_id: contactLoginId, deletedAt: null } });

    // 사용자 또는 요청 대상 사용자가 존재하지 않을 경우 예외를 발생.
    if (!user || !contactUser) {
      throw new BadRequestException('대상 사용자를 찾을 수 없습니다.');
    }

    // 사용자가 자기 자신에게 인맥 요청을 보낼 수 없도록 예외를 발생.
    if (user.user_id === contactUser.user_id) {
      throw new BadRequestException('자기 자신에게 요청을 보낼 수 없습니다.');
    }

    // 이미 동일한 인맥 요청이 존재하는지 확인.
    const existingRequest = await transactionalEntityManager.findOne(FriendRequest, {
      where: [
        { sender: { user_id: userId }, receiver: { user_id: contactUser.user_id }, status: 'pending' },
        { sender: { user_id: contactUser.user_id }, receiver: { user_id: userId }, status: 'pending' }
      ]
    });

    // 이미 요청이 존재할 경우 예외를 발생시킵니다.
    if (existingRequest) {
      throw new ConflictException('이미 인맥 요청을 보냈거나 받았습니다.');
    }

    // 이미 인맥 관계가 존재하는지 확인.
    const existingContact = await transactionalEntityManager.findOne(BusinessContact, {
      where: { 
        userAccount: { user_id: userId },
        contact_user: { user_id: contactUser.user_id }
      },
    });

    // 이미 인맥 관계가 존재할 경우 예외를 발생.
    if (existingContact) {
      throw new ConflictException('이미 인맥 관계가 존재합니다.');
    }

    // 새로운 인맥 요청을 생성하고 저장.
    const newRequest = transactionalEntityManager.create(FriendRequest, {
      sender: user,
      receiver: contactUser,
      status: 'pending'
    });

    const savedRequest = await transactionalEntityManager.save(newRequest);
    return { requestId: savedRequest.request_id };
  });
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
  
      // 요청 상태를 수락으로 변경
      request.status = 'accepted';
      await transactionalEntityManager.save(request);
  
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
    });
  }

  // 인맥 요청을 거절하는 메서드
  async rejectContactRequest(userId: number, requestId: number): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {

    // 해당 요청이 존재하는지 확인
    const request = await transactionalEntityManager.findOne(FriendRequest, {
      where: { 
        request_id: requestId, 
        receiver: { user_id: userId, deletedAt: null },
        sender: { deletedAt: null },
        status: 'pending' 
      }
    });

    // 요청을 찾지 못했을 경우 예외를 발생
    if (!request) {
      throw new NotFoundException('해당 인맥 요청을 찾을 수 없습니다.');
    }

    // 요청 상태를 거절로 변경하고 저장
    request.status = 'rejected';
    await transactionalEntityManager.save(request);

  });
  }

  // 받은 인맥 요청 목록을 조회하는 메서드
  async getReceivedRequests(userId: number): Promise<ReceivedRequestResult[]> {
    
    // 사용자가 받은 대기 중인 인맥 요청들을 조회
    const requests = await this.friendRequestRepository.find({
      where: { 
        receiver: { user_id: userId, deletedAt: null },
        sender: { deletedAt: null },
        status: 'pending' 
      },
      relations: ['sender'],
      order: { created_at: 'DESC' }
    });

    return requests.map(req => ({
      requestId: req.request_id,
      senderLoginId: req.sender.login_id,
      senderName: req.sender.name,
      requestedAt: req.created_at
    }));
  }

  // 보낸 인맥 요청 목록을 조회하는 메서드
  async getSentRequests(userId: number): Promise<SentRequestResult[]> {

    // 사용자가 보낸 대기 중인 인맥 요청들을 조회합니다.
    const requests = await this.friendRequestRepository.find({
      where: { 
        sender: { user_id: userId, deletedAt: null },
        receiver: { deletedAt: null },
        status: 'pending' 
      },
      relations: ['receiver'],
      order: { created_at: 'DESC' }
    });

    return requests.map(req => ({
      requestId: req.request_id,
      receiverLoginId: req.receiver.login_id,
      receiverName: req.receiver.name,
      requestedAt: req.created_at
    }));
  }

  // 기존 인맥을 제거하는 메서드
  async deleteContact(userId: number, contactUserId: number): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
     // 양방향 관계 모두 체크 (userAccount <-> contact_user)
    const contact = await transactionalEntityManager.findOne(BusinessContact, {
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
  
  });
  }
}