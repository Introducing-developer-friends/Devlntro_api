import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../types/auth.type';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    });
  }

  async validate(payload: TokenPayload) {
    try {
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepository.findOne({
        where: { user_id: payload.sub },
      });

      // 사용자가 존재하지 않으면 예외 발생
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // 토큰의 버전이 사용자 계정의 현재 버전보다 낮은 경우 예외 발생
      if (user.currentTokenVersion > payload.version) {
        throw new UnauthorizedException('Token expired');
      }

      // 사용자 ID와 사용자명을 반환 (Passport가 요청 객체에 추가)
      return {
        userId: payload.sub,
        username: payload.username,
      };
    } catch (error) {
      // UnauthorizedException 이외의 에러를 일반적인 인증 실패로 변환
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
