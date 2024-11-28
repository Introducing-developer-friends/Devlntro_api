import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UserAccount } from '../entities/user-account.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenPayload } from '../types/auth.type';

// JWT 인증 전략(JwtStrategy) 테스트 스위트
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockConfigService: { get: jest.Mock };
  let mockUserRepository: {
    findOne: jest.Mock<Promise<Partial<UserAccount> | null>>;
  };

  // 각 테스트 실행 전 모듈 초기화
  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    mockUserRepository = {
      findOne: jest.fn(),
    };

    // TestingModule 생성 및 JwtStrategy, ConfigService, UserRepository 주입
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

    // JwtStrategy 인스턴스 가져오기
    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  // validate 메서드 테스트
  describe('validate', () => {
    const validPayload: TokenPayload = {
      sub: 1,
      username: 'testuser',
      type: 'access',
      version: 1,
    };

    // 정상적인 액세스 토큰 검증 테스트
    it('should successfully validate an access token', async () => {
      const mockUser = {
        user_id: validPayload.sub,
        currentTokenVersion: validPayload.version,
        username: validPayload.username
      };
      
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await strategy.validate(validPayload);

      expect(result).toEqual({
        userId: validPayload.sub,
        username: validPayload.username
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: validPayload.sub }
      });
    });

    // refresh 토큰 타입이 거부되는지 테스트
    it('should reject refresh token type', async () => {
      const refreshTokenPayload: TokenPayload = {
        ...validPayload,
        type: 'refresh'
      };

      await expect(strategy.validate(refreshTokenPayload))
        .rejects
        .toThrow(new UnauthorizedException('Invalid token type'));
      
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    // 구 버전 토큰이 거부되는지 테스트
    it('should reject outdated token version', async () => {
      const mockUser = {
        user_id: validPayload.sub,
        currentTokenVersion: validPayload.version + 1,
        username: validPayload.username
      };
      
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      await expect(strategy.validate(validPayload))
        .rejects
        .toThrow(new UnauthorizedException('Token expired'));
    });

    // 존재하지 않는 사용자에 대한 토큰 거부 테스트
    it('should reject non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(strategy.validate(validPayload))
        .rejects
        .toThrow(new UnauthorizedException('Invalid token'));
    });

    it('should handle database error gracefully', async () => {
      mockUserRepository.findOne.mockRejectedValueOnce(new Error('DB Error'));

      await expect(strategy.validate(validPayload))
        .rejects
        .toThrow(new UnauthorizedException('Authentication failed'));
    });
  });
});