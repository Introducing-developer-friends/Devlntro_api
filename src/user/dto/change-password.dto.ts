import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ChangePasswordDto {
  @ApiProperty({ description: '현재 비밀번호' })
  @IsString()
  currentPassword: string;

  // 새 비밀번호를 나타내며, 문자열이어야 하고 최소 길이가 8자 이상이어야 함
  @ApiProperty({ description: '새 비밀번호' })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ description: '새 비밀번호 확인' })
  @IsString()
  @MinLength(8)
  confirmNewPassword: string;
}