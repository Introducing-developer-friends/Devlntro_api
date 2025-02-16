import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UserAccount } from '../user/entity/user-account.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenPayload } from '../types/auth.type';
import { ErrorMessageType } from '../enums/error.message.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockConfigService: { get: jest.Mock };
  let mockUserRepository: {
    findOne: jest.Mock<Promise<Partial<UserAccount> | null>>;
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') {
          return 'test-secret';
        }
        return null;
      }),
    };

    mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    const validPayload: TokenPayload = {
      sub: 1,
      username: 'testuser',
      type: 'access',
      version: 1,
    };

    it('should successfully validate an access token', async () => {
      const mockUser = {
        user_id: validPayload.sub,
        currentTokenVersion: validPayload.version,
        username: validPayload.username,
      };

      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await strategy.validate(validPayload);

      expect(result).toEqual({
        userId: validPayload.sub,
        username: validPayload.username,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: validPayload.sub },
      });
    });

    it('should reject refresh token type', async () => {
      const refreshTokenPayload: TokenPayload = {
        ...validPayload,
        type: 'refresh',
      };

      await expect(strategy.validate(refreshTokenPayload)).rejects.toThrow(
        new UnauthorizedException(ErrorMessageType.INVALID_TOKEN),
      );

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should reject outdated token version', async () => {
      const mockUser = {
        user_id: validPayload.sub,
        currentTokenVersion: validPayload.version + 1,
        username: validPayload.username,
      };

      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        new UnauthorizedException(ErrorMessageType.EXPIRED_TOKEN),
      );
    });

    it('should reject non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        new UnauthorizedException(ErrorMessageType.NO_USER),
      );
    });

    it('should handle database error gracefully', async () => {
      mockUserRepository.findOne.mockRejectedValueOnce(new Error('DB Error'));

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        new UnauthorizedException(ErrorMessageType.INVALID_AUTH),
      );
    });
  });
});
