import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserDeleteInfo } from '../../types/user.types';

export class DeleteAccountDto {
  @ApiProperty({ description: '계정 삭제를 위한 비밀번호 확인' })
  @IsString()
  @IsNotEmpty()
  password: string;
}