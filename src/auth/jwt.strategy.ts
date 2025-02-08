import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../types/auth.type';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
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

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      if (user.currentTokenVersion > payload.version) {
        throw new UnauthorizedException('Token expired');
      }

      return {
        userId: payload.sub,
        username: payload.username,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
