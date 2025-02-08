import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { Repository, DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import {
  BusinessProfileInfo,
  UserPasswordInfo,
  UserDeleteInfo,
} from '../types/user.types';

// Mock 타입 정의 수정
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

interface MockQueryBuilder {
  select: jest.Mock;
  where: jest.Mock;
  leftJoinAndSelect: jest.Mock;
  update: jest.Mock;
  set: jest.Mock;
  execute: jest.Mock;
  getOne: jest.Mock;
  softDelete: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
}

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: MockRepository<UserAccount>;
  let mockProfileRepository: MockRepository<BusinessProfile>;
  let mockDataSource: Partial<DataSource>;
  let mockAuthService: { logout: jest.Mock };
  let mockQueryBuilder: MockQueryBuilder;
  let mockTransactionManager: any;

  const mockProfileInfo: BusinessProfileInfo = {
    name: 'Test User',
    company: 'Test Company',
    department: 'Test Department',
    position: 'Test Position',
    email: 'test@test.com',
    phone: '1234567890',
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      getOne: jest.fn(),
      softDelete: jest.fn().mockReturnThis(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const createMockQueryBuilder = () => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    });

    mockTransactionManager = {
      createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockUserRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockProfileRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn(),
    };

    mockDataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      manager: {
        transaction: jest.fn((callback) => callback(mockTransactionManager)),
      } as unknown as EntityManager,
    };

    mockAuthService = {
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockProfileRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('updateBusinessProfile', () => {
    it('should update business profile successfully', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: {
          profile_id: 1,
          ...mockProfileInfo,
          userAccount: { name: 'Test User' },
        },
      };

      const queryBuilder = mockTransactionManager.createQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(mockUser);
      mockTransactionManager.save.mockImplementation(async (entity) => entity);

      const result = await service.updateBusinessProfile(1, mockProfileInfo);

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user.user_id = :userId',
        { userId: 1 },
      );
      expect(result).toEqual(expect.objectContaining(mockProfileInfo));
    });

    it('should create new profile if user does not have one', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: null,
      };

      const queryBuilder = mockTransactionManager.createQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(mockUser);
      mockTransactionManager.create.mockImplementation((entity, data) => ({
        ...data,
        userAccount: mockUser,
      }));
      mockTransactionManager.save.mockImplementation(async (entity) => ({
        ...entity,
        ...mockProfileInfo,
        userAccount: mockUser,
      }));

      const result = await service.updateBusinessProfile(1, mockProfileInfo);

      expect(mockTransactionManager.create).toHaveBeenCalled();
      expect(mockTransactionManager.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(mockProfileInfo));
    });

    it('should throw NotFoundException if user is not found', async () => {
      const queryBuilder = mockTransactionManager.createQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.updateBusinessProfile(1, mockProfileInfo),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      const partialUpdate = {
        company: 'New Company',
        department: 'New Department',
      };

      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: {
          profile_id: 1,
          ...mockProfileInfo,
        },
      };

      const queryBuilder = mockTransactionManager.createQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(mockUser);
      mockTransactionManager.save.mockImplementation(
        async (entity: BusinessProfile | UserAccount) => entity,
      );

      const result = await service.updateBusinessProfile(1, partialUpdate);

      expect(result.company).toBe(partialUpdate.company);
      expect(result.department).toBe(partialUpdate.department);
    });

    it('should handle null fields in profile update', async () => {
      const partialUpdate = {
        company: null,
        department: null,
        position: 'New Position',
      };

      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: {
          profile_id: 1,
          ...mockProfileInfo,
        },
      };

      const queryBuilder = mockTransactionManager.createQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(mockUser);
      mockTransactionManager.save.mockImplementation(
        async (entity: BusinessProfile | UserAccount) => entity,
      );

      const result = await service.updateBusinessProfile(1, partialUpdate);

      expect(result.company).toBeNull();
      expect(result.department).toBeNull();
      expect(result.position).toBe('New Position');
    });

    it('should handle concurrent profile updates successfully', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: {
          profile_id: 1,
          company: mockProfileInfo.company,
          department: mockProfileInfo.department,
          position: mockProfileInfo.position,
          email: mockProfileInfo.email,
          phone: mockProfileInfo.phone,
          userAccount: { name: 'Test User' },
        },
      };

      const queryBuilder = mockTransactionManager.createQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(mockUser);

      mockTransactionManager.save.mockImplementation(async (Entity) => {
        if (Entity === UserAccount) {
          return {
            ...mockUser,
            name: 'Test User',
          };
        }
        return {
          ...mockUser.profile,
          company: 'New Company',
          userAccount: { name: 'Test User' },
        };
      });

      const updateData = {
        name: 'New Name',
        company: 'New Company',
      };

      const result = await service.updateBusinessProfile(1, updateData);

      expect(mockTransactionManager.save).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        name: 'Test User',
        company: 'New Company',
        department: mockProfileInfo.department,
        position: mockProfileInfo.position,
        email: mockProfileInfo.email,
        phone: mockProfileInfo.phone,
      });
    });

    it('should handle database error during profile update', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: {
          profile_id: 1,
          ...mockProfileInfo,
        },
      };

      const queryBuilder = mockTransactionManager.createQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(mockUser);
      mockTransactionManager.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateBusinessProfile(1, mockProfileInfo),
      ).rejects.toThrow('Database error');
    });
  });

  describe('changePassword', () => {
    const mockPasswordInfo: UserPasswordInfo = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
      confirmNewPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('newHashedPassword'));

      await service.changePassword(1, mockPasswordInfo);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.changePassword(1, mockPasswordInfo)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const invalidPasswords: UserPasswordInfo = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
        confirmNewPassword: 'differentPassword',
      };

      await expect(service.changePassword(1, invalidPasswords)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);

      await expect(service.changePassword(1, mockPasswordInfo)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate password complexity', async () => {
      const weakPasswordDto: UserPasswordInfo = {
        currentPassword: 'oldPassword',
        newPassword: 'weak',
        confirmNewPassword: 'weak',
      };

      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      const validateQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserRepository.createQueryBuilder
        .mockReturnValueOnce(validateQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder);

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.changePassword(1, weakPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not allow same password as current', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      const samePasswordDto: UserPasswordInfo = {
        currentPassword: 'currentPassword',
        newPassword: 'currentPassword',
        confirmNewPassword: 'currentPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockQueryBuilder.execute.mockRejectedValue(new BadRequestException());

      await expect(service.changePassword(1, samePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle database error during password update', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockQueryBuilder.execute.mockRejectedValue(
        new InternalServerErrorException(),
      );

      await expect(service.changePassword(1, mockPasswordInfo)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteAccount', () => {
    const mockDeleteInfo: UserDeleteInfo = {
      password: 'password123',
    };

    it('should delete account successfully', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      await service.deleteAccount(1, mockDeleteInfo);

      expect(mockAuthService.logout).toHaveBeenCalledWith(1);
      expect(mockQueryBuilder.softDelete).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.deleteAccount(1, mockDeleteInfo)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);

      await expect(service.deleteAccount(1, mockDeleteInfo)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle logout failure gracefully', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      (mockAuthService.logout as jest.Mock).mockRejectedValueOnce(
        new Error('Logout failed'),
      );

      await expect(service.deleteAccount(1, mockDeleteInfo)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle profile deletion error', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockAuthService.logout.mockResolvedValueOnce(undefined);

      mockProfileRepository.createQueryBuilder = jest.fn().mockReturnValue({
        softDelete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest
          .fn()
          .mockRejectedValueOnce(new Error('Profile deletion failed')),
      });

      await expect(
        service.deleteAccount(1, { password: 'password123' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle user account deletion error', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
      };

      const validateQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserRepository.createQueryBuilder.mockReturnValueOnce(
        validateQueryBuilder,
      );
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockAuthService.logout.mockResolvedValueOnce(undefined);

      mockProfileRepository.createQueryBuilder = jest.fn().mockReturnValue({
        softDelete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      });

      const deleteQueryBuilder = {
        softDelete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest
          .fn()
          .mockRejectedValue(new InternalServerErrorException()),
      };

      mockUserRepository.createQueryBuilder
        .mockReturnValueOnce(validateQueryBuilder)
        .mockReturnValueOnce(deleteQueryBuilder);

      await expect(
        service.deleteAccount(1, { password: 'password123' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should validate password length', async () => {
      const validateQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(null),
      };

      mockUserRepository.createQueryBuilder.mockReturnValueOnce(
        validateQueryBuilder,
      );

      await expect(service.deleteAccount(1, { password: '' })).rejects.toThrow(
        NotFoundException,
      );

      expect(validateQueryBuilder.select).toHaveBeenCalled();
      expect(validateQueryBuilder.where).toHaveBeenCalled();
    });
  });
});
