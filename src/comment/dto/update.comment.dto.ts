import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    description: '수정할 댓글 내용',
    example: '이것은 수정된 댓글 내용입니다.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
