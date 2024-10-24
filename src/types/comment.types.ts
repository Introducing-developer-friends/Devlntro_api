// types/comment.types.ts
export interface CommentResponse {
    statusCode: number;
    message: string;
    commentId?: number;
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