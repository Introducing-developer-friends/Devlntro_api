import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostCreateData } from '../../types/post.types';

export class CreatePostDto implements Omit<PostCreateData, 'imageUrl'> {
  @ApiProperty({
    description: '게시물 내용',
    example: '이것은 게시물의 내용입니다.',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: '업로드할 이미지 파일',
    type: 'string',
    format: 'binary',
  })
  image?: Express.Multer.File;
}
