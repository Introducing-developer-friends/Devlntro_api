import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from './response.type';

export class PostBasicInfo {
  @ApiProperty({ example: 123 })
  postId: number;

  @ApiProperty({ example: 456 })
  createrId: number;

  @ApiProperty({ example: '홍길동' })
  createrName: string;

  @ApiProperty({ example: '2024-09-18T12:34:56.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @ApiProperty({ example: true })
  isOwnPost: boolean;

  @ApiProperty({ example: 10 })
  likesCount: number;

  @ApiProperty({ example: 5 })
  commentsCount: number;
}

export class CommentInfo {
  @ApiProperty({ example: 1 })
  commentId: number;

  @ApiProperty({ example: 789 })
  authorId: number;

  @ApiProperty({ example: '김철수' })
  authorName: string;

  @ApiProperty({ example: '멋진 게시물이네요!' })
  content: string;

  @ApiProperty({ example: '2024-09-18T12:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 5 })
  likeCount: number;
}

export class LikeInfo {
  @ApiProperty({ example: 789 })
  userId: number;

  @ApiProperty({ example: '김철수' })
  userName: string;
}

export class PostDetailInfo extends PostBasicInfo {
  content: string;
  comments: CommentInfo[];
  likes: LikeInfo[];
}

export enum SortOption {
  LATEST = 'latest',
  LIKES = 'likes',
  COMMENTS = 'comments',
}

export enum FilterType {
  ALL = 'all',
  OWN = 'own',
  SPECIFIC = 'specific',
}

export interface FeedQuery {
  sort: SortOption;
  filter: FilterType;
  specificUserId?: number;
}

export class FeedResponse extends BaseResponse {
  @ApiProperty({ type: [PostBasicInfo] })
  posts: PostBasicInfo[];
}

export class PostDetailResponse extends BaseResponse {
  @ApiProperty({ example: 123 })
  postId: number;

  @ApiProperty({ example: 456 })
  createrId: number;

  @ApiProperty({ example: '홍길동' })
  createrName: string;

  @ApiProperty({ example: '2024-09-18T12:34:56.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @ApiProperty({ example: true })
  isOwnPost: boolean;

  @ApiProperty({ example: 10 })
  likesCount: number;

  @ApiProperty({ example: 5 })
  commentsCount: number;

  @ApiProperty({ example: '게시물 내용입니다.' })
  content: string;

  @ApiProperty({ type: [CommentInfo] })
  comments: CommentInfo[];

  @ApiProperty({ type: [LikeInfo] })
  likes: LikeInfo[];
}
