import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// 로그인 시 필요한 데이터 전송 객체 (DTO)
export class LoginDto {

  // 사용자의 로그인 ID (문자열, 필수)
  @ApiProperty({
    description: '사용자의 로그인 ID',
    example: 'test_id'
  })
  @IsString()
  @IsNotEmpty()
  login_id: string;
  

  // 사용자의 비밀번호 (문자열, 필수)
  @ApiProperty({
    description: '사용자의 비밀번호',
    example: 'password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}