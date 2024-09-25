import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    // AuthService 모의 객체 설정
    mockAuthService = {
      checkIdAvailability: jest.fn().mockResolvedValue({
        available: true,
        message: '사용 가능한 아이디입니다.'
      }),
      register: jest.fn().mockResolvedValue({
        userId: 1,
        message: '회원가입이 성공적으로 완료되었습니다.'
      }),
      login: jest.fn().mockResolvedValue({
        token: 'JWT_TOKEN',
        userId: 1
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // AuthController 특정 테스트
  it('should return availability for valid ID', async () => {
    const result = await controller.checkId('test_id');
    expect(result).toEqual({
      statusCode: 200,
      message: '사용 가능한 아이디입니다.'
    });
  });

  it('should throw BadRequestException on register failure', async () => {
    mockAuthService.register = jest.fn().mockRejectedValue(new Error('Registration failed'));
    
    await expect(controller.register({
      login_id: 'test',
      password: 'password',
      confirm_password: 'password123',
      name: 'Test User',
      company: 'Test Company',
      department: 'Test Dept',
      position: 'Developer',
      email: 'test@test.com',
      phone: '01012345678',
    })).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException on invalid login', async () => {
    mockAuthService.login = jest.fn().mockResolvedValue(null);
    
    await expect(controller.login({
      login_id: 'test',
      password: 'wrong_password',
    })).rejects.toThrow(UnauthorizedException);
  });
});