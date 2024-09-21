// update-business-profile.dto.ts
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBusinessProfileDto {

  @ApiProperty({ description: '이름' })
  @IsString()
  @IsOptional()
  name?: string;

  // 회사 이름을 나타내며, 선택적 필드로 값이 제공되면 문자열이어야 함
  @ApiProperty({ description: '회사명' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({ description: '부서' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: '직책' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ description: '이메일' })
  // 이메일 주소를 나타내며, 선택적 필드로 값이 제공되면 이메일 형식이어야 함
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: '전화번호' })
  @IsString()
  @IsOptional()
  phone?: string;
}