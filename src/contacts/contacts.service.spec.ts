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
  };

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
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getContactList(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'userAccount.deletedAt IS NULL',
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'contact_user.deletedAt IS NULL',
      );
    });

    it('should handle bidirectional contacts correctly', async () => {
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

    it('should handle deleted user access attempt', async () => {
      queryBuilder.where.mockReturnThis();
      queryBuilder.andWhere.mockReturnThis();
      queryBuilder.getOne.mockResolvedValue(null); // null 반환하도록 수정

      await expect(service.getContactDetail(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

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
        .mockResolvedValueOnce(null);

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
        status: FriendRequestStatus.PENDING,
      } as FriendRequest;

      const mockEntityManager = {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === FriendRequest) {
            return Promise.resolve(mockRequest);
          }
          if (entity === BusinessContact) {
            return Promise.resolve({ contact_id: 1 });
          }
          return Promise.resolve(null);
        }),
        save: jest.fn(),
        create: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (cb) => await cb(mockEntityManager),
      );

      await service.acceptContactRequest(2, 1);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'accepted' }),
      );
    });

    it('should handle concurrent accept requests', async () => {
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

    it('should handle wrong receiver rejection attempt', async () => {
      mockFriendRequestRepository.findOne.mockResolvedValue(null);

      await expect(service.rejectContactRequest(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

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

  describe('deleteContact', () => {
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

    it('should throw NotFoundException', async () => {
      mockContactRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteContact(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle already deleted contact', async () => {
      mockContactRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteContact(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should find and delete bidirectional contact', async () => {
      const contact = {
        contact_id: 1,
        userAccount: mockUsers[1],
        contact_user: mockUsers[0],
        deleted_at: null,
      } as BusinessContact;

      mockContactRepository.findOne.mockResolvedValue(contact);

      await service.deleteContact(1, 2);
      expect(mockContactRepository.softRemove).toHaveBeenCalledWith(contact);
    });

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
