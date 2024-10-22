// 사용자의 비즈니스 프로필 정보를 나타내는 인터페이스
export interface BusinessProfileInfo {
    name?: string;
    company?: string;
    department?: string;
    position?: string;
    email?: string;
    phone?: string;
  }
  
  // 사용자가 비밀번호 변경 시 제공해야 하는 정보를 나타내는 인터페이스
  export interface UserPasswordInfo {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }
  
  // 사용자가 계정을 삭제할 때 제공해야 하는 정보를 나타내는 인터페이스
  export interface UserDeleteInfo {
    password: string;
  }
  
  // API 응답의 기본 구조를 나타내는 인터페이스
  export interface BaseResponse {
    statusCode: number;
    message: string;
  }
  
  // 비즈니스 프로필 조회 시 반환되는 응답 구조 인터페이스
  export interface BusinessProfileResponse extends BaseResponse {
    profile?: BusinessProfileInfo;
  }
  
  // 비밀번호 변경 시 반환되는 응답 구조 인터페이스
  export interface PasswordChangeResponse extends BaseResponse {}
  
  // 계정 삭제 시 반환되는 응답 구조 인터페이스
  export interface AccountDeleteResponse extends BaseResponse {}