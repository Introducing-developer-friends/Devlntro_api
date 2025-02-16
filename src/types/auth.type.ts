import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from './response.type';

export class LoginResponse extends BaseResponse {
  @ApiProperty({ description: '액세스 토큰', example: 'eyJhbGciOiJ...' })
  accessToken: string;

  @ApiProperty({ description: '리프레시 토큰', example: 'eyJhbGciOiJ...' })
  refreshToken: string;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;
}

export class RefreshTokenResponse extends BaseResponse {
  @ApiProperty({
    description: '새로 발급된 액세스 토큰',
    example: 'eyJhbGciOiJ...',
  })
  accessToken: string;
}

export class RegisterResponse extends BaseResponse {
  @ApiProperty({ description: '생성된 사용자 ID', example: 1 })
  userId: number;
}

export class LogoutResponse extends BaseResponse {}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  userId: number;
}

export interface RegisterResult {
  userId: number;
}

export interface BasePayload {
  username: string;
  sub: number;
}

export interface TokenPayload extends BasePayload {
  version: number;
  type: 'access' | 'refresh';
}

export interface IdCheckResult {
  available: boolean;
}
