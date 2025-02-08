export interface PostBasicInfo {
  postId: number;
  createrId: number;
  createrName: string;
  createdAt: Date;
  imageUrl: string;
  isOwnPost: boolean;
  likesCount: number;
  commentsCount: number;
}

export interface CommentInfo {
  commentId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: Date;
  likeCount: number;
}

export interface LikeInfo {
  userId: number;
  userName: string;
}

export interface PostDetailInfo extends PostBasicInfo {
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

export interface BaseResponse {
  statusCode: number;
  message: string;
}

export interface FeedResponse extends BaseResponse {
  posts: PostBasicInfo[];
}

export interface PostDetailResponse extends BaseResponse, PostDetailInfo {}
