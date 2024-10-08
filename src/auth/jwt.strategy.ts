import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: any
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const cacheKey = `user_${payload.sub}`;
    const cachedUser = await this.cacheManager.get(cacheKey);
    
    if (cachedUser) {
      console.log('캐시에서 사용자 정보 가져옴:', cachedUser);
      return cachedUser;
    }

    const user = { userId: payload.sub, username: payload.username };
    await this.cacheManager.set(cacheKey, user, { ttl: 3600 }); // 1시간 캐시
    console.log('데이터베이스 조회 후 사용자 정보 캐싱:', user);

    return Promise.resolve(user);
  }
}
