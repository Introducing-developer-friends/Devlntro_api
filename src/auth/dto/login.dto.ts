import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '사용자의 로그인 ID',
    example: 'test_id',
  })
  @IsString()
  @IsNotEmpty()
  login_id: string;

  @ApiProperty({
    description: '사용자의 비밀번호',
    example: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
