import { IsString, IsNotEmpty } from 'class-validator';

// 로그인 시 필요한 데이터 전송 객체 (DTO)
export class LoginDto {

  // 사용자의 로그인 ID (문자열, 필수)
  @IsString()
  @IsNotEmpty()
  login_id: string;

  // 사용자의 비밀번호 (문자열, 필수)
  @IsString()
  @IsNotEmpty()
  password: string;
}