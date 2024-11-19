import { Injectable, UnauthorizedException  } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../types/auth.type';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccount } from 'src/entities/user-account.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: TokenPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('유효하지 않은 토큰 타입입니다.');
    }
  
    // 토큰 버전 검증
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub }
    });
  
    if (user.currentTokenVersion > payload.version) {
      throw new UnauthorizedException('만료된 토큰입니다.');
    }
  
    return {
      userId: payload.sub,
      username: payload.username
    };
  }
}