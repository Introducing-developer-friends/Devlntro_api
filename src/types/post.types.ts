// 게시물 생성 시 필요한 데이터 인터페이스
export interface PostCreateData {
    content: string;
    imageUrl: string | null;
  }
  
  // 게시물 업데이트 시 필요한 데이터 인터페이스
  export interface PostUpdateData {
    content?: string;
    imageUrl?: string | null;
  }
  
  // 게시물의 기본 정보를 나타내는 인터페이스
  export interface PostBasicInfo {
    postId: number;
    content: string;
    imageUrl: string | null;
    likeCount: number;
  }
  
  // 게시물 좋아요 정보를 나타내는 인터페이스
  export interface PostLikeInfo {
    isLiked: boolean;
    likeCount: number;
  }
  
  // API 응답 타입들

  // 기본 API 응답 구조 인터페이스
  export interface BaseResponse {
    statusCode: number;
    message: string;
  }
  
  // 게시물 생성 API 응답 인터페이스
  export interface PostCreateResponse extends BaseResponse {
    postId: number;
    imageUrl: string | null;
  }
  
  // 게시물 업데이트 API 응답 인터페이스
  export interface PostUpdateResponse extends BaseResponse {}
  
  export interface PostDeleteResponse extends BaseResponse {}
  
  export interface PostLikeResponse extends BaseResponse {
    likeCount: number;
  }