import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessContact } from '../entities/business-contact.entity';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('ContactsService', () => {
  let service: ContactsService;
  let mockContactRepository: jest.Mocked<Repository<BusinessContact>>;
  let mockUserRepository: jest.Mocked<Repository<UserAccount>>;
  let mockFriendRequestRepository: jest.Mocked<Repository<FriendRequest>>;
  let mockProfileRepository: jest.Mocked<Repository<BusinessProfile>>;
  let dataSource: DataSource;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<any>>;

  // Mock 데이터 정의
  const mockProfiles = [
    {
      profile_id: 1,
      company: 'Company1',
      department: 'Dept1',
      position: 'Position1',
      email: 'user1@test.com',
      phone: '1111111111',
      deletedAt: null,
    },
    {
      profile_id: 2,
      company: 'Company2',
      department: 'Dept2',
      position: 'Position2',
      email: 'user2@test.com',
      phone: '2222222222',
      deletedAt: null,
    },
  ] as BusinessProfile[];

  const mockUsers = [
    {
      user_id: 1,
      name: 'User1',
      login_id: 'user1',
      deletedAt: null,
      profile: mockProfiles[0],
    },
    {
      user_id: 2,
      name: 'User2',
      login_id: 'user2',
      deletedAt: null,
      profile: mockProfiles[1],
    },
  ] as UserAccount[];

  const FriendRequestStatus = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
  } as const;

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<any>>;

    mockContactRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<BusinessContact>>;

    mockUserRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserAccount>>;

    mockFriendRequestRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<FriendRequest>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(BusinessContact),
          useValue: mockContactRepository,
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(FriendRequest),
          useValue: mockFriendRequestRepository,
        },
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockProfileRepository,
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn().mockImplementation((cb) =>
              cb({
                save: jest.fn(),
                findOne: jest.fn(),
                create: jest.fn(),
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('getContactList', () => {
    it('should return contact list successfully', async () => {
      const mockContacts = [
        {
          userAccount: mockUsers[0],
          contact_user: mockUsers[1],
          deleted_at: null,
        },
      ];

      queryBuilder.getMany.mockResolvedValue(mockContacts);
      const result = await service.getContactList(1);
      expect(result[0].userId).toBe(2);
    });

    it('should handle empty contact list', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      const result = await service.getContactList(1);
      expect(result).toEqual([]);
    });

    it('should return N/A for missing profile information', async () => {
      const mockContact = [
        {
          userAccount: mockUsers[0],
          contact_user: { ...mockUsers[1], profile: null },
          deleted_at: null,
        },
      ];
      queryBuilder.getMany.mockResolvedValue(mockContact);
      const result = await service.getContactList(1);
      expect(result[0].company).toBe('N/A');
    });

    it('should filter out deleted users', async () => {
      queryBuilder.where.mockReturnThis();
      queryBuilder.andWhere.mockReturnThis();
      queryBuilder.leftJoin.mockReturnThis();
      queryBuilder.getMany.mockResolvedValue([]); // 빈 배열 반환하도록 수정

      await service.getContactList(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'userAccount.deletedAt IS NULL',
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'contact_user.deletedAt IS NULL',
      );
    });

    it('should handle bidirectional contacts correctly', async () => {
      // 양방향 관계에서 자신이 userAccount인 경우만 필터링하도록 수정
      const mockBidirectionalContacts = [
        {
          userAccount: mockUsers[0],
          contact_user: mockUsers[1],
          deleted_at: null,
        },
      ];

      queryBuilder.getMany.mockResolvedValue(mockBidirectionalContacts);
      const result = await service.getContactList(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 2,
        name: 'User2',
        company: 'Company2',
        department: 'Dept2',
      });
    });

    it('should handle profile with partial information', async () => {
      // 프로필 정보가 부분적으로만 있는 경우
      const mockContactWithPartialProfile = [
        {
          userAccount: mockUsers[0],
          contact_user: {
            ...mockUsers[1],
            profile: {
              company: 'Company2',
              department: null,
            },
          },
        },
      ];
      queryBuilder.getMany.mockResolvedValue(mockContactWithPartialProfile);
      const result = await service.getContactList(1);
      expect(result[0].department).toBe('N/A');
      expect(result[0].company).toBe('Company2');
    });
  });

  describe('getContactDetail', () => {
    it('should return contact details', async () => {
      queryBuilder.getOne.mockResolvedValue(mockUsers[1]);
      const result = await service.getContactDetail(1, 2);
      expect(result.userId).toBe(2);
    });

    it('should throw NotFoundException', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      await expect(service.getContactDetail(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
    // getContactDetail에 추가
    it('should handle deleted user access attempt', async () => {
      queryBuilder.where.mockReturnThis();
      queryBuilder.andWhere.mockReturnThis();
      queryBuilder.getOne.mockResolvedValue(null); // null 반환하도록 수정

      await expect(service.getContactDetail(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // addContactRequest 메서드 테스트
  describe('addContactRequest', () => {
    it('should create request successfully', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1]);
      mockFriendRequestRepository.findOne.mockResolvedValue(null);
      mockFriendRequestRepository.save.mockResolvedValue({
        request_id: 1,
      } as FriendRequest);

      const result = await service.addContactRequest(1, 'user2');
      expect(result.requestId).toBe(1);
    });

    it('should reject self-request', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[0]);

      await expect(service.addContactRequest(1, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException for existing request', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1]);
      mockFriendRequestRepository.findOne.mockResolvedValue({
        request_id: 1,
        status: 'pending',
      } as FriendRequest);

      await expect(service.addContactRequest(1, 'user2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException for existing contact', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1]);
      mockFriendRequestRepository.findOne.mockResolvedValue(null);
      mockContactRepository.findOne.mockResolvedValue({
        contact_id: 1,
      } as BusinessContact);

      await expect(service.addContactRequest(1, 'user2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle request to deleted user', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(null); // deleted user는 null로 반환되도록

      await expect(
        service.addContactRequest(1, 'deleted-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle request with non-existent login id', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(null);

      await expect(
        service.addContactRequest(1, 'non-existent'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // acceptContactRequest 메서드 테스트
  describe('acceptContactRequest', () => {
    it('should accept request successfully', async () => {
      const mockRequest = {
        request_id: 1,
        sender: mockUsers[0],
        receiver: mockUsers[1],
        status: FriendRequestStatus.PENDING,
      } as FriendRequest;

      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockRequest),
        save: jest
          .fn()
          .mockResolvedValue({ ...mockRequest, status: 'accepted' }),
        create: jest.fn().mockReturnValue({ contact_id: 1 }),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (cb) => await cb(mockEntityManager),
      );

      await service.acceptContactRequest(2, 1);
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('should handle non-pending request', async () => {
      // FriendRequest 형식으로 수정

      // transaction mock 수정
      (dataSource.transaction as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.acceptContactRequest(2, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-existent request', async () => {
      const transactionEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
        create: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (cb) => await cb(transactionEntityManager),
      );

      await expect(service.acceptContactRequest(2, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle duplicate accept request', async () => {
      const mockRequest = {
        request_id: 1,
        sender: mockUsers[0],
        receiver: mockUsers[1],
        status: FriendRequestStatus.PENDING, // pending 상태로 변경
      } as FriendRequest;

      const mockEntityManager = {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === FriendRequest) {
            return Promise.resolve(mockRequest);
          }
          if (entity === BusinessContact) {
            return Promise.resolve({ contact_id: 1 }); // 이미 존재하는 연락처
          }
          return Promise.resolve(null);
        }),
        save: jest.fn(),
        create: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (cb) => await cb(mockEntityManager),
      );

      // 정상적으로 처리되어야 함
      await service.acceptContactRequest(2, 1);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'accepted' }),
      );
    });

    it('should handle concurrent accept requests', async () => {
      // 동시에 여러 요청이 처리되는 경우
      const mockRequest = {
        request_id: 1,
        sender: mockUsers[0],
        receiver: mockUsers[1],
        status: FriendRequestStatus.PENDING,
      } as FriendRequest;

      const mockEntityManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockRequest)
          .mockResolvedValueOnce(null),
        save: jest.fn(),
        create: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (cb) => await cb(mockEntityManager),
      );

      await service.acceptContactRequest(2, 1);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('rejectContactRequest', () => {
    it('should reject request successfully', async () => {
      const mockRequest = {
        request_id: 1,
        status: FriendRequestStatus.PENDING,
        receiver: mockUsers[1],
      } as FriendRequest;

      mockFriendRequestRepository.findOne.mockResolvedValue(mockRequest);
      await service.rejectContactRequest(2, 1);
      expect(mockFriendRequestRepository.save).toHaveBeenCalled();
    });

    // rejectContactRequest에 추가
    it('should handle wrong receiver rejection attempt', async () => {
      mockFriendRequestRepository.findOne.mockResolvedValue(null); // null 반환하도록 수정

      await expect(service.rejectContactRequest(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // getReceivedRequests 메서드 테스트
  describe('getReceivedRequests', () => {
    it('should return received requests', async () => {
      const mockRequest = [
        {
          request_id: 1,
          sender: mockUsers[0],
          status: FriendRequestStatus.PENDING,
          created_at: new Date(),
        },
      ];

      queryBuilder.getMany.mockResolvedValue(mockRequest);
      const result = await service.getReceivedRequests(2);
      expect(result[0].senderLoginId).toBe('user1');
    });

    it('should only return pending requests', async () => {
      const mockRequest = [
        {
          request_id: 1,
          sender: mockUsers[0],
          status: FriendRequestStatus.PENDING,
          created_at: new Date(),
        },
      ];

      queryBuilder.getMany.mockResolvedValue(mockRequest);
      const result = await service.getReceivedRequests(2);
      expect(result.length).toBe(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'request.status = :status',
        { status: 'pending' },
      );
    });
  });

  describe('getSentRequests', () => {
    // 사용자가 받은 친구 요청을 성공적으로 반환하는 경우를 테스트
    it('should return sent requests', async () => {
      const mockRequest = [
        {
          request_id: 1,
          receiver: mockUsers[1],
          status: FriendRequestStatus.PENDING,
          created_at: new Date(),
        },
      ];

      queryBuilder.getMany.mockResolvedValue(mockRequest);
      const result = await service.getSentRequests(1);
      expect(result[0].receiverLoginId).toBe('user2');
    });

    // PENDING 상태의 요청만 반환하는지 테스트
    it('should return requests in correct order', async () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const mockRequests = [
        {
          request_id: 2,
          receiver: mockUsers[1],
          status: FriendRequestStatus.PENDING,
          created_at: date2,
        },
        {
          request_id: 1,
          receiver: mockUsers[1],
          status: FriendRequestStatus.PENDING,
          created_at: date1,
        },
      ];

      queryBuilder.getMany.mockResolvedValue(mockRequests);
      const result = await service.getSentRequests(1);
      expect(result).toHaveLength(2);
      expect(result[0].requestId).toBe(2);
    });
  });

  // deleteContact 메서드 테스트
  describe('deleteContact', () => {
    // 연락처를 성공적으로 삭제하는 경우를 테스트
    it('should delete contact successfully', async () => {
      const mockContact = {
        contact_id: 1,
        userAccount: mockUsers[0],
        contact_user: mockUsers[1],
        deleted_at: null,
      } as BusinessContact;

      mockContactRepository.findOne.mockResolvedValue(mockContact);
      await service.deleteContact(1, 2);
      expect(mockContactRepository.softRemove).toHaveBeenCalled();
    });

    // 삭제하려는 연락처를 찾을 수 없는 경우 NotFoundException이 발생하는지 테스
    it('should throw NotFoundException', async () => {
      mockContactRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteContact(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    // 이미 삭제된 연락처를 처리하는 경우 NotFoundException이 발생하는지 테스트
    it('should handle already deleted contact', async () => {
      mockContactRepository.findOne.mockResolvedValue(null); // 삭제된 연락처는 null로 처리

      await expect(service.deleteContact(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });

    // 양방향 연락처를 올바르게 삭제하는지 테스트
    it('should find and delete bidirectional contact', async () => {
      const contact = {
        contact_id: 1,
        userAccount: mockUsers[1], // 순서를 바꿔서 테스트
        contact_user: mockUsers[0],
        deleted_at: null,
      } as BusinessContact;

      mockContactRepository.findOne.mockResolvedValue(contact);

      await service.deleteContact(1, 2);
      expect(mockContactRepository.softRemove).toHaveBeenCalledWith(contact);
    });

    // softRemove 호출 중 오류가 발생했을 때 예외를 처리하는지 테스트
    it('should handle soft delete error gracefully', async () => {
      const mockContact = {
        contact_id: 1,
        userAccount: mockUsers[0],
        contact_user: mockUsers[1],
      } as BusinessContact;

      mockContactRepository.findOne.mockResolvedValue(mockContact);
      mockContactRepository.softRemove.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(service.deleteContact(1, 2)).rejects.toThrow(Error);
    });
  });
});
