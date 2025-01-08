// auth.types.ts
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  userId: number;
}

// 회원가입용 결과 타입
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

// 공통 응답 타입
export interface BaseResponse {
  statusCode: number;
  message: string;
}

// AuthResult를 재활용한 로그인 응답
export interface LoginResponse extends BaseResponse, AuthResult {}

// 토큰 갱신 응답
export interface RefreshTokenResponse extends BaseResponse {
  accessToken: string;
}

export type CheckIdResponse = BaseResponse;

export interface RegisterResponse extends BaseResponse {
  userId: number;
}

export type LogoutResponse = BaseResponse;
