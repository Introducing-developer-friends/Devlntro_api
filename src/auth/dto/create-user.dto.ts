import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자의 로그인 ID',
    example: 'testuser1',
  })
  @IsString()
  @IsNotEmpty()
  login_id: string;

  @ApiProperty({
    description: '사용자의 비밀번호',
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: '사용자의 비밀번호 확인',
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  confirm_password: string;

  @ApiProperty({
    description: '사용자의 이름',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '사용자의 회사 이름',
    example: 'Tech Corp',
  })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({
    description: '사용자의 부서',
    example: 'Engineering',
  })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({
    description: '사용자의 직급',
    example: 'Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({
    description: '사용자의 이메일 주소',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '사용자의 전화번호',
    example: '010-1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
