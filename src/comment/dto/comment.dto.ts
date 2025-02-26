import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 댓글 생성을 위한 DTO
export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '이것은 댓글 내용입니다.',
  })
  @IsNotEmpty() // 빈 값 검증
  @IsString() // 문자열 타입 검증
  content: string;
}

// 댓글 수정을 위한 DTO
export class UpdateCommentDto {
  @ApiProperty({
    description: '수정할 댓글 내용',
    example: '이것은 수정된 댓글 내용입니다.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
