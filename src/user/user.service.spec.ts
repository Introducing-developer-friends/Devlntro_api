import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { Repository, DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import { 
  BusinessProfileInfo, 
  UserPasswordInfo,
  UserDeleteInfo
} from '../types/user.types';

// Mock 타입 정의
type MockType<T> = {
  [P in keyof T]?: jest.Mock;
};

type MockEntityManager = Partial<EntityManager> & {
  findOne: jest.Mock;
  save: jest.Mock;
  softDelete: jest.Mock;
  create: jest.Mock;
};

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: MockType<Repository<UserAccount>>;
  let mockProfileRepository: MockType<Repository<BusinessProfile>>;
  let mockEntityManager: MockEntityManager;
  let mockDataSource: MockType<DataSource>;

  // 테스트 시작 전, 필요한 Mock 객체들을 설정
  beforeEach(async () => {
    mockEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      create: jest.fn(),
    };

    // Mock UserAccount 및 BusinessProfile Repository 설정
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    // Mock DataSource 설정
    mockProfileRepository = {
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    mockDataSource = {
      manager: {
        transaction: jest.fn().mockImplementation(cb => cb(mockEntityManager)),
      },
    } as any;

    // bcrypt mock 초기화
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();

    // TestingModule 설정 및 주입
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserRepository
        },
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockProfileRepository
        },
        {
          provide: DataSource,
          useValue: mockDataSource
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  // UserService가 정의되었는지 확인하는 기본 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 비즈니스 프로필 업데이트 테스트
  describe('updateBusinessProfile', () => {
    const mockProfileInfo: BusinessProfileInfo = {
      name: 'Test User',
      company: 'Test Company',
      department: 'Test Department',
      position: 'Test Position',
      email: 'test@test.com',
      phone: '1234567890'
    };

    // 비즈니스 프로필을 성공적으로 업데이트하는 테스트
    it('should update business profile successfully', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: {
          profile_id: 1,
          ...mockProfileInfo,
          userAccount: { name: 'Test User' }
        }
      } as UserAccount;

      // Mock EntityManager 설정
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockEntityManager.save.mockImplementation(entity => Promise.resolve(entity));

      // updateBusinessProfile 메서드 호출
      const result = await service.updateBusinessProfile(1, mockProfileInfo);

      // 결과가 예상한 mockProfileInfo와 일치하는지 확인
      expect(result).toEqual(mockProfileInfo);
    });

    // 새로운 프로필을 생성하는 테스트 (사용자가 프로필을 가지고 있지 않은 경우)
    it('should create new profile if user does not have one', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        profile: null
      } as UserAccount;

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockEntityManager.create.mockReturnValue({
        ...mockProfileInfo,
        userAccount: mockUser
      });
      mockEntityManager.save.mockImplementation(entity => Promise.resolve(entity));

      const result = await service.updateBusinessProfile(1, mockProfileInfo);

      expect(result).toEqual(mockProfileInfo);
    });

    // 사용자를 찾을 수 없는 경우 NotFoundException 발생을 테스트
    it('should throw NotFoundException if user is not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.updateBusinessProfile(1, mockProfileInfo))
        .rejects.toThrow(new NotFoundException('사용자를 찾을 수 없습니다.'));
    });
  });

  // 비밀번호 변경 테스트
  describe('changePassword', () => {
    const mockPasswordInfo: UserPasswordInfo = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
      confirmNewPassword: 'newPassword123'
    };

    // 비밀번호를 성공적으로 변경하는 테스트
    it('should change password successfully', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword'
      } as UserAccount;

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await service.changePassword(1, mockPasswordInfo);

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        UserAccount,
        expect.objectContaining({
          user_id: 1,
          password: 'newHashedPassword'
        })
      );
    });

    // 현재 비밀번호가 틀릴 때 UnauthorizedException을 발생시키는 테스트
    it('should throw UnauthorizedException if current password is incorrect', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword'
      } as UserAccount;

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, mockPasswordInfo))
        .rejects.toThrow(new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.'));
    });

    // 새로운 비밀번호와 확인 비밀번호가 일치하지 않을 때 BadRequestException을 발생시키는 테스트
    it('should throw BadRequestException if new passwords do not match', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword'
      } as UserAccount;

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      // 현재 비밀번호 검증을 통과하도록 설정
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const invalidPasswordInfo: UserPasswordInfo = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
        confirmNewPassword: 'differentPassword'
      };

      await expect(service.changePassword(1, invalidPasswordInfo))
        .rejects.toThrow(new BadRequestException('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'));
    });

    // 사용자를 찾을 수 없는 경우 NotFoundException 발생을 테스트
    it('should throw NotFoundException if user is not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.changePassword(1, mockPasswordInfo))
        .rejects.toThrow(new NotFoundException('사용자를 찾을 수 없습니다.'));
    });
  });

  // 계정 삭제 테스트
  describe('deleteAccount', () => {
    const mockDeleteInfo: UserDeleteInfo = {
      password: 'password123'
    };

    // 계정을 성공적으로 삭제하는 테스트
    it('should delete account successfully', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword',
        profile: { profile_id: 1 }
      } as UserAccount;

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.deleteAccount(1, mockDeleteInfo);

      // 프로필과 사용자 계정이 소프트 삭제되었는지 확인
      expect(mockEntityManager.softDelete).toHaveBeenNthCalledWith(1, BusinessProfile, mockUser.profile.profile_id);
      expect(mockEntityManager.softDelete).toHaveBeenNthCalledWith(2, UserAccount, mockUser.user_id);
    });

    // 비밀번호가 일치하지 않을 때 UnauthorizedException 발생을 테스트
    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = {
        user_id: 1,
        password: 'hashedPassword'
      } as UserAccount;

      mockEntityManager.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.deleteAccount(1, mockDeleteInfo))
        .rejects.toThrow(new UnauthorizedException('비밀번호가 올바르지 않습니다.'));
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount(1, mockDeleteInfo))
        .rejects.toThrow(new NotFoundException('User not found'));
    });
  });
});