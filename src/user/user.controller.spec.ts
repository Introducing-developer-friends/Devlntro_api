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
  AccountDeleteResponse 
} from '../types/user.types';

// Mock service의 타입 정의: UserService의 메서드를 부분적으로 모의(Mock)로 정의
type MockUserService = Partial<{
  updateBusinessProfile: jest.Mock;
  changePassword: jest.Mock;
  deleteAccount: jest.Mock;
}>;

// UserController 테스트 스위트
describe('UserController', () => {
  let controller: UserController;
  let mockUserService: Partial<UserService>;

  // 테스트 시작 전 각 테스트 환경을 설정하는 beforeEach 블록
  beforeEach(async () => {
    // Mock 프로필 데이터
    const mockProfile = {
      name: 'Test User',
      company: 'Test Company'
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
    it('should update business profile successfully', async () => {
      const updateProfileDto: UpdateBusinessProfileDto = {
        name: 'Test User',
        company: 'Test Company'
      };
      const req = { user: { userId: 1 } };

      const result = await controller.updateBusinessProfile(
        req as any,
        updateProfileDto
      );

      expect(result).toEqual<BusinessProfileResponse>({
        statusCode: HttpStatus.OK,
        message: '프로필 정보가 성공적으로 수정되었습니다.',
        profile: {
          name: 'Test User',
          company: 'Test Company'
        }
      });
      expect(mockUserService.updateBusinessProfile).toHaveBeenCalledWith(
        req.user.userId,
        updateProfileDto
      );
    });
  });

  // 비밀번호 변경 기능 테스트
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      };
      const req = { user: { userId: 1 } };

      const result = await controller.changePassword(
        req as any,
        changePasswordDto
      );

      // 기대하는 응답 및 mock 호출 확인
      expect(result).toEqual<PasswordChangeResponse>({
        statusCode: HttpStatus.OK,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      });
      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        req.user.userId,
        changePasswordDto
      );
    });
  });

  // 계정 삭제 기능 테스트
  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      
      // 계정 삭제 DTO 및 요청 객체 설정
      const deleteAccountDto: DeleteAccountDto = {
        password: 'password123'
      };
      const req = { user: { userId: 1 } };

      const result = await controller.deleteAccount(
        req as any,
        deleteAccountDto
      );

      // 기대하는 응답 및 mock 호출 확인
      expect(result).toEqual<AccountDeleteResponse>({
        statusCode: HttpStatus.OK,
        message: '회원 탈퇴가 성공적으로 처리되었습니다.'
      });

      // UserService의 deleteAccount 메서드가 올바른 인수로 호출되었는지 확인
      expect(mockUserService.deleteAccount).toHaveBeenCalledWith(
        req.user.userId,
        deleteAccountDto
      );
    });
  });
});
