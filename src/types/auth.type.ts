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

export interface BaseResponse {
  statusCode: number;
  message: string;
}

export interface LoginResponse extends BaseResponse, AuthResult {}

export interface RefreshTokenResponse extends BaseResponse {
  accessToken: string;
}

export type CheckIdResponse = BaseResponse;

export interface RegisterResponse extends BaseResponse {
  userId: number;
}

export type LogoutResponse = BaseResponse;
