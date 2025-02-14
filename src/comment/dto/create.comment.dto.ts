import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '이것은 댓글 내용입니다.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
