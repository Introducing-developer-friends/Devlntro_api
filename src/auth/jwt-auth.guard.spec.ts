import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { ErrorMessageType } from '../enums/error.message.enum';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('handleRequest', () => {
    const mockUser = {
      userId: 1,
      username: 'testuser',
    };

    it('should return user when validation is successful', () => {
      const result = guard.handleRequest(null, mockUser);
      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when no user is provided', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        new UnauthorizedException(ErrorMessageType.INVALID_AUTH),
      );
    });

    it('should throw original error when error is provided', () => {
      const error = new Error('Custom error');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });

    it('should throw UnauthorizedException when both error and user are null', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        new UnauthorizedException(ErrorMessageType.INVALID_AUTH),
      );
    });
  });
});
