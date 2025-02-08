import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessProfileInfo } from '../../types/user.types';

export class UpdateBusinessProfileDto implements Partial<BusinessProfileInfo> {
  @ApiProperty({ description: '이름' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: '회사명',
    required: false,
  })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({
    description: '부서명',
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: '직책',
    required: false,
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    description: '이메일',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '전화번호',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
