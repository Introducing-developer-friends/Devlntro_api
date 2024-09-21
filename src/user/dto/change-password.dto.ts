import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  // 새 비밀번호를 나타내며, 문자열이어야 하고 최소 길이가 8자 이상이어야 함
  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @MinLength(8)
  confirmNewPassword: string;
}