import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { BusinessProfileResponse } from '../../types/user.types';
import { BaseResponse } from 'src/types/response.type';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: Partial<UserService>;

  beforeEach(async () => {
    const mockProfile = {
      name: 'Test User',
      company: 'Test Company',
      department: 'IT',
      position: 'Developer',
      email: 'test@test.com',
      phone: '010-1234-5678',
    };

    mockUserService = {
      updateBusinessProfile: jest.fn().mockResolvedValue(mockProfile),
      changePassword: jest.fn().mockResolvedValue(undefined),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const mockRequest = { user: { userId: 1 } };

  describe('updateBusinessProfile', () => {
    it('should properly pass data to service and return formatted response', async () => {
      const updateProfileDto: UpdateBusinessProfileDto = {
        name: 'Test User',
        company: 'Test Company',
        department: 'IT',
        position: 'Developer',
        email: 'test@test.com',
        phone: '010-1234-5678',
      };

      const result = await controller.updateBusinessProfile(
        mockRequest,
        updateProfileDto,
      );

      expect(mockUserService.updateBusinessProfile).toHaveBeenCalledWith(
        mockRequest.user.userId,
        updateProfileDto,
      );

      expect(result).toEqual<BusinessProfileResponse>({
        statusCode: HttpStatus.OK,
        message: '프로필 정보가 성공적으로 수정되었습니다.',
        profile: expect.objectContaining(updateProfileDto),
      });
    });
  });

  describe('changePassword', () => {
    it('should properly pass data to service and return formatted response', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      };

      const result = await controller.changePassword(
        mockRequest,
        changePasswordDto,
      );

      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        mockRequest.user.userId,
        changePasswordDto,
      );

      expect(result).toEqual<BaseResponse>({
        statusCode: HttpStatus.OK,
        message: '비밀번호가 성공적으로 변경되었습니다.',
      });
    });
  });

  describe('deleteAccount', () => {
    it('should properly pass data to service and return formatted response', async () => {
      const deleteAccountDto: DeleteAccountDto = {
        password: 'password123',
      };

      const result = await controller.deleteAccount(
        mockRequest,
        deleteAccountDto,
      );

      expect(mockUserService.deleteAccount).toHaveBeenCalledWith(
        mockRequest.user.userId,
        deleteAccountDto,
      );

      expect(result).toEqual<BaseResponse>({
        statusCode: HttpStatus.OK,
        message: '회원 탈퇴가 성공적으로 처리되었습니다.',
      });
    });
  });
});
