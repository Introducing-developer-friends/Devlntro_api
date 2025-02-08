import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostCreateData, PostUpdateData } from '../../types/post.types';

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

export class UpdatePostDto
  implements Partial<Omit<PostUpdateData, 'imageUrl'>>
{
  @ApiPropertyOptional({
    description: '게시물 내용 (선택 입력)',
    example: '이것은 수정된 게시물의 내용입니다.',
    type: String,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: '새로 업로드할 이미지 파일 (선택)',
    type: 'string',
    format: 'binary',
  })
  image?: Express.Multer.File;
}
