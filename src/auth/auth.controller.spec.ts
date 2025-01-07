import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      checkIdAvailability: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkId', () => {
    it('should return availability for a valid ID', async () => {
      authService.checkIdAvailability.mockResolvedValue({ available: true });

      const result = await controller.checkId('test_id');
      expect(result).toEqual({
        statusCode: 200,
        message: '사용 가능한 아이디입니다.',
      });
      expect(authService.checkIdAvailability).toHaveBeenCalledWith('test_id');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const dto = {
        login_id: 'test',
        password: 'password',
        confirm_password: 'password',
        name: 'Test User',
        company: 'Test Company',
        department: 'Test Dept',
        position: 'Developer',
        email: 'test@test.com',
        phone: '01012345678',
      };

      authService.register.mockResolvedValue({ userId: 1 });

      const result = await controller.register(dto);
      expect(result).toEqual({
        statusCode: 201,
        message: '회원가입이 성공적으로 완료되었습니다.',
        userId: 1,
      });
      expect(authService.register).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException on error', async () => {
      authService.register.mockRejectedValue(
        new BadRequestException('회원가입 실패'),
      );

      const dto = {
        login_id: 'test',
        password: 'password',
        confirm_password: 'password',
        name: 'Test User',
        company: 'Test Company',
        department: 'Test Dept',
        position: 'Developer',
        email: 'test@test.com',
        phone: '01012345678',
      };

      await expect(controller.register(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'ACCESS_TOKEN',
        refreshToken: 'REFRESH_TOKEN',
        userId: 1,
      });

      const dto = { login_id: 'test', password: 'password' };
      const result = await controller.login(dto);

      expect(result).toEqual({
        statusCode: 200,
        message: '로그인 성공',
        accessToken: 'ACCESS_TOKEN',
        refreshToken: 'REFRESH_TOKEN',
        userId: 1,
      });
      expect(authService.login).toHaveBeenCalledWith(dto);
    });

    it('should throw UnauthorizedException if login fails', async () => {
      authService.login.mockResolvedValue(null);

      const dto = { login_id: 'test', password: 'wrongpassword' };
      await expect(controller.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      authService.refreshAccessToken.mockResolvedValue({
        accessToken: 'NEW_ACCESS_TOKEN',
      });

      const dto = { refreshToken: 'REFRESH_TOKEN' };
      const result = await controller.refreshToken(dto);

      expect(result).toEqual({
        statusCode: 200,
        message: '토큰 갱신 성공',
        accessToken: 'NEW_ACCESS_TOKEN',
      });
      expect(authService.refreshAccessToken).toHaveBeenCalledWith(
        'REFRESH_TOKEN',
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockReq = { user: { userId: 1 } };
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockReq);
      expect(result).toEqual({
        statusCode: 200,
        message: '로그아웃 성공',
      });
      expect(authService.logout).toHaveBeenCalledWith(1);
    });
  });
});
