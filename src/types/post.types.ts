import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from './response.type';

export interface PostCreateData {
  content: string;
  imageUrl: string | null;
}

export interface PostUpdateData {
  content?: string;
  imageUrl?: string | null;
}

export interface PostBasicInfo {
  postId: number;
  content: string;
  imageUrl: string | null;
  likeCount: number;
}

export interface PostLikeInfo {
  isLiked: boolean;
  likeCount: number;
}

export class PostCreateResponse extends BaseResponse {
  @ApiProperty({ example: 1 })
  postId: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  imageUrl: string | null;
}

export class PostLikeResponse extends BaseResponse {
  @ApiProperty({ example: 5 })
  likeCount: number;
}
