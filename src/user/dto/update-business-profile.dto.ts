// update-business-profile.dto.ts
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateBusinessProfileDto {

  // 회사 이름을 나타내며, 선택적 필드로 값이 제공되면 문자열이어야 함
  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  position?: string;

  // 이메일 주소를 나타내며, 선택적 필드로 값이 제공되면 이메일 형식이어야 함
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}