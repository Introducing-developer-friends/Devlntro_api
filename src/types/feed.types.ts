  // 게시물 기본 정보 인터페이스
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
  
  // 댓글 정보 인터페이스
  export interface CommentInfo {
    commentId: number;
    authorId: number;
    authorName: string;
    content: string;
    createdAt: Date;
    likeCount: number;
  }
  
  // 좋아요 정보 인터페이스
  export interface LikeInfo {
    userId: number;
    userName: string;
  }
  
  // 게시물 상세 정보 인터페이스
  export interface PostDetailInfo extends PostBasicInfo {
    content: string;
    comments: CommentInfo[];
    likes: LikeInfo[];
  }
  
  // API 요청/응답 관련 타입들

  // 정렬 옵션 열거형
  export enum SortOption {
    LATEST = 'latest',
    LIKES = 'likes',
    COMMENTS = 'comments',
  }
  
  // 필터 타입 열거형
  export enum FilterType {
    ALL = 'all',
    OWN = 'own',
    SPECIFIC = 'specific',
  }

  // 피드 조회 시 사용되는 쿼리 파라미터 인터페이스
  export interface FeedQuery {
    sort: SortOption;
    filter: FilterType;
    specificUserId?: number;
  }

  // API 응답 타입들

  // 기본 응답 구조 인터페이스
  export interface BaseResponse {
        statusCode: number;
        message: string;
  }
  
  // 피드 조회 응답 인터페이스
  export interface FeedResponse extends BaseResponse {
    posts: PostBasicInfo[];
  }
  
  // 게시물 상세 조회 응답 인터페이스
  export interface PostDetailResponse extends BaseResponse, PostDetailInfo {}