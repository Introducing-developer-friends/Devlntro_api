import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserAccount } from '../entities/user-account.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshToken } from 'src/entities/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // .env 파일을 로드하기 위한 설정
    PassportModule, // Passport 모듈을 사용해 인증 처리
    JwtModule.registerAsync({
      imports: [ConfigModule], // ConfigModule을 가져옴
      inject: [ConfigService], // ConfigService를 주입
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // .env 파일에서 JWT_SECRET을 가져옴
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        }, // 토큰 만료 시간 설정
      }),
    }),
    TypeOrmModule.forFeature([UserAccount, BusinessProfile, RefreshToken]),
  ],
  providers: [AuthService, JwtStrategy], // AuthService와 JwtStrategy를 주입
  controllers: [AuthController], // AuthController를 모듈에 연결
  exports: [AuthService], // AuthService를 다른 모듈에서도 사용할 수 있게 설정
})
export class AuthModule {}
