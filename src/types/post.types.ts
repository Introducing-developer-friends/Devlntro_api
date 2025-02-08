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

export interface BaseResponse {
  statusCode: number;
  message: string;
}

export interface PostCreateResponse extends BaseResponse {
  postId: number;
  imageUrl: string | null;
}

export type PostUpdateResponse = BaseResponse;
export type PostDeleteResponse = BaseResponse;

export interface PostLikeResponse extends BaseResponse {
  likeCount: number;
}
