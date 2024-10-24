import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ContactListResult,
  ContactDetailResult,
  ContactRequestResult,
  ReceivedRequestResult,
  SentRequestResult
} from '../types/contacts.types';

describe('ContactsService', () => {
    let service: ContactsService;
    let userRepository: Repository<UserAccount>;
    let contactRepository: Repository<BusinessContact>;
    let friendRequestRepository: Repository<FriendRequest>;
    let dataSource: DataSource;

    // 각 테스트 전에 모듈 설정
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(BusinessContact),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserAccount),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(FriendRequest),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BusinessProfile),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    userRepository = module.get<Repository<UserAccount>>(getRepositoryToken(UserAccount));
    contactRepository = module.get<Repository<BusinessContact>>(getRepositoryToken(BusinessContact));
    friendRequestRepository = module.get<Repository<FriendRequest>>(getRepositoryToken(FriendRequest));
    dataSource = module.get<DataSource>(DataSource);
  });

  // 서비스가 정의되었는지 테스트
  it('should be defined', () => {
    expect(service).toBeDefined(); // ContactsService가 정의되었는지 확인
  });

  // getContactList 메서드 테스트
  describe('getContactList', () => {
    const mockContactList: ContactListResult[] = [
      {
        userId: 2,
        name: 'User2',
        company: 'Company2',
        department: 'Dept2'
      }
    ];

    it('should return contact list', async () => {
      const mockContacts = [
        {
          userAccount: { user_id: 1, name: 'User1' },
          contact_user: {
            user_id: 2,
            name: 'User2',
            profile: { company: 'Company2', department: 'Dept2' }
          }
        }
      ];

      // createQueryBuilder 모킹
      jest.spyOn(contactRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockContacts),
      } as any);

      const result = await service.getContactList(1);
      expect(result).toEqual(mockContactList);
    });
  });

  // getContactDetail 메서드 테스트
  describe('getContactDetail', () => {
    const mockContactDetail: ContactDetailResult = {
      userId: 2,
      name: 'User2',
      company: 'Company2',
      department: 'Dept2',
      position: 'Position2',
      email: 'user2@example.com',
      phone: '1234567890'
    };

    it('should return contact detail', async () => {
      const mockUser = {
        user_id: 2,
        name: 'User2',
        profile: {
          company: 'Company2',
          department: 'Dept2',
          position: 'Position2',
          email: 'user2@example.com',
          phone: '1234567890'
        }
      };

      // findOne 메서드를 모킹하여 mockUser 반환
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as UserAccount);
      const result = await service.getContactDetail(1, 2);
      expect(result).toEqual(mockContactDetail);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(service.getContactDetail(1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  // addContactRequest 메서드 테스트
  describe('addContactRequest', () => {
    const mockRequestResult: ContactRequestResult = {
      requestId: 1
    };

    it('should create contact request', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn()
            .mockResolvedValueOnce({ user_id: 1 } as UserAccount)
            .mockResolvedValueOnce({ user_id: 2 } as UserAccount)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null),
          create: jest.fn().mockReturnValue({ request_id: 1 }),
          save: jest.fn().mockResolvedValue({ request_id: 1 })
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock); // 트랜잭션 모킹

      const result = await service.addContactRequest(1, 'user2');
      expect(result).toEqual(mockRequestResult);
    });

    it('should throw BadRequestException if user or contactUser is not found', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValue(null),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(service.addContactRequest(1, 'user2')).rejects.toThrow(BadRequestException);
    });
  });

  // acceptContactRequest 메서드 테스트
  describe('acceptContactRequest', () => {
    it('should accept contact request', async () => {
      const mockRequest = {
        request_id: 1,
        sender: { user_id: 2 },
        receiver: { user_id: 1 },
        status: 'pending'
      };

      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValue(mockRequest),
          save: jest.fn().mockResolvedValue({ ...mockRequest, status: 'accepted' }),
          create: jest.fn().mockReturnValue({ contact_id: 1 }),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      await service.acceptContactRequest(1, 1);
      // void 반환이므로 호출만 확인
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  // rejectContactRequest 메서드 테스트
  describe('rejectContactRequest', () => {
    it('should reject contact request', async () => {
      const mockRequest = {
        request_id: 1,
        sender: { user_id: 2 }, // 발신자 정보
        receiver: { user_id: 1 },
        status: 'pending'
      };
  
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(mockRequest),
          save: jest.fn().mockResolvedValueOnce({ ...mockRequest, status: 'rejected' }),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);
  
      await service.rejectContactRequest(1, 1); // 사용자 ID 1이 요청 ID 1을 거절
      // void 반환이므로 트랜잭션 호출과 상태 변경만 확인
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  
    it('should throw NotFoundException if request not found', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(null),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);
  
      await expect(service.rejectContactRequest(1, 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // getReceivedRequests 메서드 테스트
  describe('getReceivedRequests', () => {
    const mockReceivedRequests: ReceivedRequestResult[] = [
      {
        requestId: 1,
        senderLoginId: 'user2',
        senderName: 'User2',
        requestedAt: new Date()
      }
    ];

    it('should return received requests', async () => {
      jest.spyOn(friendRequestRepository, 'find').mockResolvedValue([
        {
          request_id: 1,
          sender: { login_id: 'user2', name: 'User2' },
          created_at: mockReceivedRequests[0].requestedAt // 요청 생성일
        }
      ] as FriendRequest[]);

      const result = await service.getReceivedRequests(1);
      expect(result).toEqual(mockReceivedRequests);
    });
  });

  // getSentRequests 메서드 테스트
  describe('getSentRequests', () => {
    const mockSentRequests: SentRequestResult[] = [
      {
        requestId: 1,
        receiverLoginId: 'user2',
        receiverName: 'User2',
        requestedAt: new Date()
      }
    ];

    it('should return sent requests', async () => {
      jest.spyOn(friendRequestRepository, 'find').mockResolvedValue([
        {
          request_id: 1,
          receiver: { login_id: 'user2', name: 'User2' },
          created_at: mockSentRequests[0].requestedAt
        }
      ] as FriendRequest[]);

      const result = await service.getSentRequests(1);
      expect(result).toEqual(mockSentRequests); // mockSentRequests와 동일한 결과가 반환되는지 확인
    });
  });

  // deleteContact 메서드 테스트
  describe('deleteContact', () => {
    it('should delete contact', async () => {
      const mockContact = {
        contact_id: 1,
        userAccount: { user_id: 1 }, 
        contact_user: { user_id: 2 }
      } as BusinessContact;
  
      // transactionalEntityManager 설정
      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockContact),
        softRemove: jest.fn().mockResolvedValue(mockContact)
      };
  
      // Transaction 모킹
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb(mockEntityManager);
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);
  
      // Repository의 softRemove 모킹
      jest.spyOn(contactRepository, 'softRemove')
        .mockImplementation(() => Promise.resolve(mockContact));
  
      await service.deleteContact(1, 2);
  
      // 트랜잭션이 실행되었는지 확인
      expect(transactionMock).toHaveBeenCalled();
      
      // findOne이 호출되었는지 확인
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(BusinessContact, {
        where: [
          {
            userAccount: { user_id: 1 },
            contact_user: { user_id: 2 },
            deleted_at: null
          },
          {
            userAccount: { user_id: 2 },
            contact_user: { user_id: 1 },
            deleted_at: null
          }
        ],
        relations: ['userAccount', 'contact_user']
      });
  
      // softRemove가 호출되었는지 확인
      expect(contactRepository.softRemove).toHaveBeenCalledWith(mockContact);
    });
  
    it('should throw NotFoundException if contact not found', async () => {
      // transactionalEntityManager 설정
      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),
        softRemove: jest.fn()
      };
  
      // Transaction 모킹
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb(mockEntityManager);
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);
  
      // Repository의 softRemove 모킹
      jest.spyOn(contactRepository, 'softRemove')
        .mockImplementation(() => Promise.resolve({} as BusinessContact));
  
      await expect(service.deleteContact(1, 2))
        .rejects
        .toThrow(NotFoundException);
  
      // findOne은 호출되었지만 softRemove는 호출되지 않았는지 확인
      expect(mockEntityManager.findOne).toHaveBeenCalled();
      expect(contactRepository.softRemove).not.toHaveBeenCalled();
    });
  });
});