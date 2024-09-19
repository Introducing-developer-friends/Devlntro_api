import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string; // 게시물 내용 필수 입력
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string; // 게시물 내용 선택 입력
}