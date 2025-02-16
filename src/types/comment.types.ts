import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from './response.type';

export class CommentCreateResponse extends BaseResponse {
  @ApiProperty({ description: '댓글 ID', example: 1, required: false })
  commentId?: number;
}

export class CommentLikeResponse extends BaseResponse {
  @ApiProperty({
    description: '댓글 좋아요 카운트',
    example: 1,
    required: false,
  })
  likeCount?: number;
}

export interface CommentCreateResult {
  commentId: number;
}

export interface CommentLikeResult {
  isLiked: boolean;
  likeCount: number;
}

export interface CommentUpdateResult {
  commentId: number;
  content: string;
}

export interface CommentDeleteResult {
  commentId: number;
  isDeleted: boolean;
}
