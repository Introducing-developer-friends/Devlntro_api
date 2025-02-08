export interface BusinessProfileInfo {
  name?: string;
  company?: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
}

export interface UserPasswordInfo {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserDeleteInfo {
  password: string;
}

export interface BaseResponse {
  statusCode: number;
  message: string;
}

export interface BusinessProfileResponse extends BaseResponse {
  profile?: BusinessProfileInfo;
}

export type PasswordChangeResponse = BaseResponse;

export type AccountDeleteResponse = BaseResponse;
