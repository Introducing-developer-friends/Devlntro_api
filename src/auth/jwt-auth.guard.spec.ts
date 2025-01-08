import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  // 테스트 실행 전 JwtAuthGuard 인스턴스를 생성
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

    // 유효한 사용자 객체가 제공되었을 때 handleRequest가 사용자 객체를 반환하는지 테스트
    it('should return user when validation is successful', () => {
      const result = guard.handleRequest(null, mockUser);
      expect(result).toBe(mockUser);
    });

    // 사용자 객체가 없을 때 UnauthorizedException을 발생시키는지 테스트
    it('should throw UnauthorizedException when no user is provided', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        new UnauthorizedException('인증 토큰이 누락되었습니다.'),
      );
    });

    // 오류가 제공된 경우 해당 오류를 그대로 전달하는지 테스트
    it('should throw original error when error is provided', () => {
      const error = new Error('Custom error');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });

    // 오류와 사용자 객체가 모두 null인 경우 UnauthorizedException을 발생시키는지 테스트
    it('should throw UnauthorizedException when both error and user are null', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        new UnauthorizedException('인증 토큰이 누락되었습니다.'),
      );
    });
  });
});
