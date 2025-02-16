import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserPasswordInfo } from '../../types/user.types';
export class ChangePasswordDto implements UserPasswordInfo {
  @ApiProperty({ description: '현재 비밀번호' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: '새 비밀번호' })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ description: '새 비밀번호 확인' })
  @IsString()
  @MinLength(8)
  confirmNewPassword: string;
}
