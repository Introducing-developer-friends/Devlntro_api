import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserAccount } from '../user/entity/user-account.entity';
import { BusinessProfile } from '../user/entity/business-profile.entity';
import { RefreshToken } from './entity/refresh-token.entity';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockProfileRepository: any;
  let mockRefreshTokenRepository: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockQueryBuilder: any;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getOne: jest.fn(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        save: jest.fn(),
        create: jest.fn(),
      },
    };

    mockUserRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        },
      },
      update: jest.fn(),
    };

    mockProfileRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockRefreshTokenRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('test_token'),
      verifyAsync: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('test_secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIdAvailability', () => {
    it('should return true if ID is available', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      const result = await service.checkIdAvailability('test_id');
      expect(result).toEqual({ available: true });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.login_id = :login_id',
        { login_id: 'test_id' },
      );
    });

    it('should return false if ID is not available', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.checkIdAvailability('test_id');
      expect(result).toEqual({ available: false });
    });
  });

  describe('register', () => {
    const registerDto = {
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

    it('should register a new user', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      mockQueryRunner.manager.create
        .mockImplementationOnce((entity, data) => ({
          user_id: 1,
          ...data,
        }))
        .mockImplementationOnce((entity, data) => ({ ...data }));
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({ user_id: 1 })
        .mockResolvedValueOnce({});

      const result = await service.register(registerDto);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ userId: 1 });
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const invalidDto = {
        ...registerDto,
        confirm_password: 'different_password',
      };

      await expect(service.register(invalidDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ user_id: 1 });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle database error during registration', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('DB Error'));

      const registerDto = {
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

      await expect(service.register(registerDto)).rejects.toThrow(Error);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const invalidEmailDto = {
        login_id: 'test',
        password: 'password',
        confirm_password: 'password',
        name: 'Test User',
        company: 'Test Company',
        department: 'Test Dept',
        position: 'Developer',
        email: 'invalid-email',
        phone: '01012345678',
      };

      mockQueryBuilder.getOne.mockResolvedValue(null);

      const mockUser = { user_id: 1, ...invalidEmailDto };
      mockQueryRunner.manager.create
        .mockImplementationOnce(() => mockUser)
        .mockImplementationOnce((entity, data) => ({ ...data }));

      mockQueryRunner.manager.save.mockRejectedValueOnce(
        new Error('Invalid email format'),
      );

      await expect(service.register(invalidEmailDto)).rejects.toThrow(Error);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { login_id: 'test', password: 'password' };

    it('should return token and userId on successful login', async () => {
      const mockUser = {
        user_id: 1,
        login_id: 'test',
        password: 'hashed_password',
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'test_token',
        refreshToken: 'test_token',
        userId: 1,
      });
    });

    it('should return null for invalid credentials', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.login(loginDto);

      expect(result).toBeNull();
    });

    it('should handle incorrect password', async () => {
      const mockUser = {
        user_id: 1,
        login_id: 'test',
        password: 'hashed_password',
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.login(loginDto);

      expect(result).toBeNull();
    });

    it('should handle case when user is not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.login({
        login_id: 'nonexistent',
        password: 'password',
      });

      expect(result).toBeNull();
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const mockTokenEntity = {
        user: { user_id: 1, login_id: 'test' },
        token: 'valid_refresh_token',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockTokenEntity);
      mockJwtService.verifyAsync.mockResolvedValue({ type: 'refresh', sub: 1 });
      mockJwtService.signAsync.mockResolvedValue('new_access_token');

      const result = await service.refreshAccessToken('valid_refresh_token');
      expect(result).toEqual({ accessToken: 'new_access_token' });
    });

    it('should return null for expired refresh token', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      const result = await service.refreshAccessToken('expired_token');
      expect(result).toBeNull();
    });

    it('should return null for invalid token type', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        user: { user_id: 1, login_id: 'test' },
        token: 'valid_token',
      });
      mockJwtService.verifyAsync.mockResolvedValue({ type: 'access' });

      const result = await service.refreshAccessToken('invalid_type_token');
      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(1);
      mockQueryBuilder.execute.mockResolvedValueOnce({ affected: 1 });

      await expect(service.logout(1)).resolves.not.toThrow();
    });

    it('should throw error if already logged out', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);

      await expect(service.logout(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if logout operation fails', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(1);
      mockQueryBuilder.execute.mockResolvedValueOnce({ affected: 0 });

      await expect(service.logout(1)).rejects.toThrow(BadRequestException);
    });
  });
});
