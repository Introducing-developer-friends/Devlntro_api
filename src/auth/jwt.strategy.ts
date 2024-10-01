import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) { // ConfigService 주입
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization 헤더에서 토큰 추출
      ignoreExpiration: false, // 토큰 만료를 무시하지 않음
      secretOrKey: configService.get<string>('JWT_SECRET'), // 환경변수에서 JWT 시크릿 가져옴
    });
  }

  async validate(payload: any) {
    // 토큰 검증 후 사용자 정보 반환
    return { userId: payload.sub, username: payload.username }; // 토큰의 페이로드에서 사용자 정보 반환
  }
}
