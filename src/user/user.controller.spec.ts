import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

// UserController 테스트 스위트
describe('UserController', () => {
  let controller: UserController;
  let mockUserService: Partial<UserService>;

  // 테스트 시작 전 각 테스트 환경을 설정하는 beforeEach 블록
  beforeEach(async () => {
    mockUserService = {
      updateBusinessProfile: jest.fn().mockResolvedValue({
        statusCode: 200,
        message: "프로필 정보가 성공적으로 수정되었습니다."
      }),
      changePassword: jest.fn().mockResolvedValue({
        statusCode: 200,
        message: "비밀번호가 성공적으로 변경되었습니다."
      }),
      deleteAccount: jest.fn().mockResolvedValue({
        statusCode: 200,
        message: "회원 탈퇴가 성공적으로 처리되었습니다."
      }),
    };

    // TestingModule을 생성하여 UserController와 모의 UserService를 주입
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  // 컨트롤러가 정의되었는지 확인하는 기본 테스트
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // 비즈니스 프로필 업데이트 기능 테스트
  it('should update business profile', async () => {
    const updateProfileDto: UpdateBusinessProfileDto = {
      name: 'Test User',
      company: 'Test Company'
    };

    const req = { user: { userId: 1 } } as any;

    const result = await controller.updateBusinessProfile(req, updateProfileDto);

    expect(result).toEqual({
      statusCode: 200,
      message: '프로필 정보가 성공적으로 수정되었습니다.'
    });
  });

  // 비밀번호 변경 기능 테스트
  it('should change password successfully', async () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
      confirmNewPassword: 'newPassword123',
    };

    const req = { user: { userId: 1 } } as any; // 모의 요청 객체 생성 (req.user.userId)

    const result = await controller.changePassword(req, changePasswordDto);

    expect(result).toEqual({
      statusCode: 200,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    }); // 기대한 결과와 실제 결과가 일치하는지 확인

  });

  // 계정 삭제 기능 테스트
  it('should delete account successfully', async () => {
    const deleteAccountDto: DeleteAccountDto = { password: 'password123' };

    const req = { user: { userId: 1 } } as any;

    const result = await controller.deleteAccount(req, deleteAccountDto);

    expect(result).toEqual({
      statusCode: 200,
      message: '회원 탈퇴가 성공적으로 처리되었습니다.'
    }); // 기대한 결과와 실제 결과가 일치하는지 확인
  });
});
