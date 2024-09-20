import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({
    description: '추가할 인맥의 로그인 ID',
    example: 'john_doe'
  })
  @IsString()
  login_id: string;
}