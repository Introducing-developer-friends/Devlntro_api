import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

// 사용자 생성 시 필요한 데이터 전송 객체 (DTO)
export class CreateUserDto {

  // 사용자의 로그인 ID (문자열, 필수)
  @IsString()
  @IsNotEmpty()
  login_id: string;

  // 사용자의 비밀번호 (문자열, 필수)
  @IsString()
  @IsNotEmpty()
  password: string;

  // 사용자의 이름 (문자열, 필수)
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}