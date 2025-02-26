import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { UserAccount } from '../user/entity/user-account.entity';
import { BusinessProfile } from '../user/entity/business-profile.entity';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshToken } from './entity/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        },
      }),
    }),
    TypeOrmModule.forFeature([UserAccount, BusinessProfile, RefreshToken]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
