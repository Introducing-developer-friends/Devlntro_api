import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import {
  BusinessProfileResponse,
  PasswordChangeResponse,
  AccountDeleteResponse,
} from '../types/user.types';

// UserController 테스트 스위트
describe('UserController', () => {
  let controller: UserController;
  let mockUserService: Partial<UserService>;

  // 테스트 시작 전 각 테스트 환경을 설정하는 beforeEach 블록
  beforeEach(async () => {
    // Mock 프로필 데이터
    const mockProfile = {
      name: 'Test User',
      company: 'Test Company',
      department: 'IT',
      position: 'Developer',
      email: 'test@test.com',
      phone: '010-1234-5678',
    };

    // UserService의 메서드를 모의로 정의하여 가짜 응답을 반환
    mockUserService = {
      updateBusinessProfile: jest.fn().mockResolvedValue(mockProfile),
      changePassword: jest.fn().mockResolvedValue(undefined),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    };

    // TestingModule을 생성하여 UserController와 모의 UserService를 주입
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    // 생성된 모듈에서 UserController를 가져옴
    controller = module.get<UserController>(UserController);
  });

  // 컨트롤러가 정의되었는지 확인하는 기본 테스트
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // 비즈니스 프로필 업데이트 기능 테스트
  describe('updateBusinessProfile', () => {
    it('should properly pass data to service and return formatted response', async () => {
      const mockRequest = { user: { userId: 1 } };
      const updateProfileDto: UpdateBusinessProfileDto = {
        name: 'Test User',
        company: 'Test Company',
        department: 'IT',
        position: 'Developer',
        email: 'test@test.com',
        phone: '010-1234-5678',
      };

      const result = await controller.updateBusinessProfile(
        mockRequest as any,
        updateProfileDto,
      );

      // 서비스에 올바른 데이터가 전달되었는지 검증
      expect(mockUserService.updateBusinessProfile).toHaveBeenCalledWith(
        mockRequest.user.userId,
        updateProfileDto,
      );

      // 응답이 예상한 형식을 따르는지 검증
      expect(result).toEqual<BusinessProfileResponse>({
        statusCode: HttpStatus.OK,
        message: '프로필 정보가 성공적으로 수정되었습니다.',
        profile: expect.objectContaining(updateProfileDto),
      });
    });
  });

  // 비밀번호 변경 기능 테스트
  describe('changePassword', () => {
    it('should properly pass data to service and return formatted response', async () => {
      const mockRequest = { user: { userId: 1 } };
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      };

      const result = await controller.changePassword(
        mockRequest as any,
        changePasswordDto,
      );

      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        mockRequest.user.userId,
        changePasswordDto,
      );

      expect(result).toEqual<PasswordChangeResponse>({
        statusCode: HttpStatus.OK,
        message: '비밀번호가 성공적으로 변경되었습니다.',
      });
    });
  });

  // 계정 삭제 기능 테스트
  describe('deleteAccount', () => {
    it('should properly pass data to service and return formatted response', async () => {
      const mockRequest = { user: { userId: 1 } };
      const deleteAccountDto: DeleteAccountDto = {
        password: 'password123',
      };

      const result = await controller.deleteAccount(
        mockRequest as any,
        deleteAccountDto,
      );

      expect(mockUserService.deleteAccount).toHaveBeenCalledWith(
        mockRequest.user.userId,
        deleteAccountDto,
      );

      // 기대하는 응답 및 mock 호출 확인
      expect(result).toEqual<AccountDeleteResponse>({
        statusCode: HttpStatus.OK,
        message: '회원 탈퇴가 성공적으로 처리되었습니다.',
      });
    });
  });
});
