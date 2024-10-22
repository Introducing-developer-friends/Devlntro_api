import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';

// bcrypt 함수를 모킹(mock) 처리
jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: jest.Mocked<Repository<UserAccount>>;
  let mockProfileRepository: jest.Mocked<Repository<BusinessProfile>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    // UserAccount와 BusinessProfile의 레포지토리와 DataSource의 모킹 설정
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockProfileRepository = {
      save: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockDataSource = {
      manager: {
        transaction: jest.fn().mockImplementation((cb) => cb({
          findOne: mockUserRepository.findOne,
          save: mockUserRepository.save,
          softDelete: mockUserRepository.softDelete,
          create: jest.fn().mockReturnValue({}),
        })),
      },
    } as any;

    // TestingModule 생성 및 UserService 주입
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepository },
        { provide: getRepositoryToken(BusinessProfile), useValue: mockProfileRepository },
        { provide: DataSource, useValue: mockDataSource }, // 모킹된 DataSource 제공
      ],
    }).compile();

    service = module.get<UserService>(UserService); // UserService 인스턴스 할당
  });

  // 서비스 정의 테스트
  it('should be defined', () => {
    expect(service).toBeDefined(); // UserService가 정의되어 있는지 확인
  });

  // 비즈니스 프로필 업데이트 테스트
  describe('updateBusinessProfile', () => {
    it('should update business profile', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        user_id: 1,
        profile: { profile_id: 1 },
      } as UserAccount); // findOne 함수가 특정 유저를 반환하도록 모킹

      const result = await service.updateBusinessProfile(1, {
        name: 'Test User',
        company: 'Test Company',
      }); // updateBusinessProfile 함수 호출

      expect(result).toEqual({
        statusCode: 200,
        message: '프로필 정보가 성공적으로 수정되었습니다.',
      });
    });

    it('should create new profile if user does not have one', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        user_id: 1,
        profile: null,
      } as UserAccount);

      const result = await service.updateBusinessProfile(1, {
        name: 'Test User',
        company: 'Test Company',
      });

      expect(result).toEqual({
        statusCode: 200,
        message: '프로필 정보가 성공적으로 수정되었습니다.',
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateBusinessProfile(1, {
        name: 'Test User',
        company: 'Test Company',
      })).rejects.toThrow(NotFoundException);
    });
  });

  // 비밀번호 변경 테스트
  describe('changePassword', () => {
    it('should change password', async () => {
      mockUserRepository.findOne.mockResolvedValue({ user_id: 1, password: 'hashedPassword' } as UserAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.changePassword(1, {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      });

      // 비밀번호 변경 결과가 예상과 일치하는지 확인
      expect(result).toEqual({
        statusCode: 200,
        message: '비밀번호가 성공적으로 변경되었습니다.',
      });
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      mockUserRepository.findOne.mockResolvedValue({ user_id: 1, password: 'hashedPassword' } as UserAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // 비밀번호 변경 시 UnauthorizedException이 발생하는지 확인
      await expect(
        service.changePassword(1, {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
          confirmNewPassword: 'newPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new passwords do not match', async () => {
      mockUserRepository.findOne.mockResolvedValue({ user_id: 1, password: 'hashedPassword' } as UserAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.changePassword(1, {
          currentPassword: 'oldPassword',
          newPassword: 'newPassword123',
          confirmNewPassword: 'differentPassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword(1, {
          currentPassword: 'oldPassword',
          newPassword: 'newPassword123',
          confirmNewPassword: 'newPassword123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // 계정 삭제 테스트
  describe('deleteAccount', () => {
    it('should delete account', async () => {
      mockUserRepository.findOne.mockResolvedValue({ user_id: 1, password: 'hashedPassword', profile: { profile_id: 1 } } as UserAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.deleteAccount(1, { password: 'password123' });

      // 계정 삭제 결과가 예상과 일치하는지 확인
      expect(result).toEqual({
        statusCode: 200,
        message: '회원 탈퇴가 성공적으로 처리되었습니다.',
      });
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUserRepository.findOne.mockResolvedValue({ user_id: 1, password: 'hashedPassword', profile: { profile_id: 1 } } as UserAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.deleteAccount(1, { password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteAccount(1, { password: 'password123' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});