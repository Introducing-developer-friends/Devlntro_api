import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

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

  it('should be defined', () => {
    expect(service).toBeDefined(); // ContactsService가 정의되었는지 확인
  });

  // getContactList 메서드 테스트
  describe('getContactList', () => {

    // 연락처 리스트가 성공적으로 반환되는 경우
    it('should return contact list', async () => {
      const mockContacts = [
        { userAccount: { user_id: 1, name: 'User1' }, contact_user: { user_id: 2, name: 'User2', profile: { company: 'Company2', department: 'Dept2' } } },
        { userAccount: { user_id: 2, name: 'User2' }, contact_user: { user_id: 1, name: 'User1', profile: { company: 'Company1', department: 'Dept1' } } },
      ];

      // QueryBuilder와 메서드 모킹
      jest.spyOn(contactRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockContacts),
      } as any);

      const result = await service.getContactList(1);
      expect(result.statusCode).toBe(200);
      expect(result.contacts.length).toBe(2);
    });

    // 연락처가 없을 때 예외 처리
    it('should throw NotFoundException when no contacts found', async () => {
      jest.spyOn(contactRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      await expect(service.getContactList(1)).rejects.toThrow(NotFoundException);
    });
  });

  // getContactDetail 메서드 테스트
  describe('getContactDetail', () => {

    // 연락처 상세 정보가 성공적으로 반환되는 경우
    it('should return contact detail', async () => {
      const mockUser = { 
        user_id: 2, 
        name: 'User2', 
        profile: { company: 'Company2', department: 'Dept2', position: 'Position2', email: 'user2@example.com', phone: '1234567890' } 
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as UserAccount);

      const result = await service.getContactDetail(1, 2);
      expect(result.statusCode).toBe(200); // HTTP 상태 코드가 200인지 확인
      expect(result.contact.userId).toBe(2); // 반환된 연락처의 유저 ID가 2인지 확인
    });

    // 유저를 찾을 수 없을 때 예외 처리
    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getContactDetail(1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  // addContactRequest 메서드 테스트
  describe('addContactRequest', () => {

    // 유저 또는 연락처 유저가 없을 때 예외 처리
    it('should throw BadRequestException if user or contactUser is not found', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(service.addContactRequest(1, 'user2')).rejects.toThrow(BadRequestException);
    });

    // 친구 요청이 이미 존재할 때 예외 처리
    it('should throw ConflictException if request already exists', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn()
            .mockResolvedValueOnce({ user_id: 1 } as UserAccount)
            .mockResolvedValueOnce({ user_id: 2 } as UserAccount)
            .mockResolvedValueOnce({ request_id: 1 } as FriendRequest),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(service.addContactRequest(1, 'user2')).rejects.toThrow(ConflictException); // ConflictException 발생 여부 확인
    });

    // 연락처가 이미 존재할 때 예외 처리
    it('should throw ConflictException if contact already exists', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn()
            .mockResolvedValueOnce({ user_id: 1 } as UserAccount)
            .mockResolvedValueOnce({ user_id: 2 } as UserAccount)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ contact_id: 1 } as BusinessContact),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(service.addContactRequest(1, 'user2')).rejects.toThrow(ConflictException);
    });
  });

  // acceptContactRequest 메서드 테스트
  describe('acceptContactRequest', () => {

    // 친구 요청을 수락하는 경우
    it('should accept contact request', async () => {
      const mockRequest = { 
        request_id: 1, 
        sender: { user_id: 2 }, 
        receiver: { user_id: 1 }, 
        status: 'pending' 
      };
      const mockContact = { contact_id: 1 };
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn()
            .mockResolvedValueOnce(mockRequest) // 친구 요청 찾기
            .mockResolvedValueOnce(null), // 기존 연락처 없음
          save: jest.fn().mockResolvedValue(mockRequest),
          create: jest.fn().mockReturnValue(mockContact),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);
  
      const result = await service.acceptContactRequest(1, 1);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('인맥 요청이 수락되었습니다.');
    });
    
    // 친구 요청을 찾을 수 없을 때 예외 처리
    it('should throw NotFoundException if request not found', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(null),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);
  
      await expect(service.acceptContactRequest(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // rejectContactRequest 메서드 테스트
  describe('rejectContactRequest', () => {
    it('should reject contact request', async () => {
      const mockRequest = { 
        request_id: 1, 
        sender: { user_id: 2 }, 
        receiver: { user_id: 1 }, 
        status: 'pending' 
      };
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(mockRequest),
          save: jest.fn().mockResolvedValueOnce(mockRequest),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      const result = await service.rejectContactRequest(1, 1);
      expect(result.statusCode).toBe(200);
    });

    // 친구 요청을 찾을 수 없을 때 예외 처리
    it('should throw NotFoundException if request not found', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(null),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(service.rejectContactRequest(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // getReceivedRequests 메서드 테스트
  describe('getReceivedRequests', () => {

    // 받은 친구 요청 리스트가 성공적으로 반환되는 경우
    it('should return received requests', async () => {
      const mockRequests = [
        { request_id: 1, sender: { login_id: 'user2', name: 'User2' }, created_at: new Date() },
        { request_id: 2, sender: { login_id: 'user3', name: 'User3' }, created_at: new Date() },
      ];
      jest.spyOn(friendRequestRepository, 'find').mockResolvedValue(mockRequests as FriendRequest[]);

      const result = await service.getReceivedRequests(1);
      expect(result.statusCode).toBe(200);
      expect(result.requests.length).toBe(2);
    });
  });

  // getSentRequests 메서드 테스트
  describe('getSentRequests', () => {

    // 보낸 친구 요청 리스트가 성공적으로 반환되는 경우
    it('should return sent requests', async () => {
      const mockRequests = [
        { request_id: 1, receiver: { login_id: 'user2', name: 'User2' }, created_at: new Date() },
        { request_id: 2, receiver: { login_id: 'user3', name: 'User3' }, created_at: new Date() },
      ];
      jest.spyOn(friendRequestRepository, 'find').mockResolvedValue(mockRequests as FriendRequest[]);

      const result = await service.getSentRequests(1);
      expect(result.statusCode).toBe(200);
      expect(result.requests.length).toBe(2);
    });
  });

  // deleteContact 메서드 테스트
  describe('deleteContact', () => {

    // 연락처가 성공적으로 삭제되는 경우
    it('should delete an existing contact', async () => {
      const mockContact = { contact_id: 1 } as BusinessContact;
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(mockContact),
          softRemove: jest.fn().mockResolvedValueOnce(mockContact),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      const softRemoveSpy = jest.spyOn(contactRepository, 'softRemove').mockResolvedValueOnce(mockContact);

      const result = await service.deleteContact(1, 2);

      expect(softRemoveSpy).toHaveBeenCalledWith(mockContact);
      expect(result).toEqual({
        statusCode: 200,
        message: '인맥이 성공적으로 삭제되었습니다.',
      });
    });

    // 연락처를 찾을 수 없을 때 예외 처리
    it('should throw NotFoundException if contact is not found', async () => {
      const transactionMock = jest.fn().mockImplementation(async (cb) => {
        return await cb({
          findOne: jest.fn().mockResolvedValueOnce(null),
        });
      });
      (dataSource.transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(service.deleteContact(1, 2)).rejects.toThrow(NotFoundException);
    });
  });
});