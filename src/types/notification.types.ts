// 알림 타입 상수
export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  LIKE_POST = 'like_post',
  COMMENT = 'comment',
  LIKE_COMMENT = 'like_comment',
}

// 기본 알림 정보
export interface NotificationInfo {
  notificationId: number;
  type: NotificationType;
  message: string;
  postId?: number;
  commentId?: number;
  isRead: boolean;
  createdAt: Date;
  senderId: number;
}

// 알림 생성 데이터
export interface NotificationCreateData {
  senderId: number;
  receiverId: number;
  type: NotificationType;
  message: string;
  postId?: number;
  commentId?: number;
}

// 알림 삭제 데이터
export interface NotificationDeleteData {
  notificationIds: number[];
  userId: number;
}

// API 기본 응답 구조 인터페이스
export interface BaseResponse {
  statusCode: number;
  message: string;
}

export interface NotificationListResponse extends BaseResponse {
  notifications: NotificationInfo[];
}

// 알림 생성 응답 인터페이스
export interface NotificationCreateResponse extends BaseResponse {
  notificationId: number;
}

// 알림 업데이트 응답 인터페이스
export type NotificationUpdateResponse = BaseResponse;

// 알림 삭제 응답 인터페이스
export type NotificationDeleteResponse = BaseResponse;

// 사용자 ID 응답 인터페이스
export interface UserIdResponse extends BaseResponse {
  userId: number;
}

export interface UserIdByLoginIdResponse extends BaseResponse {
  userId: number;
}

export interface UserIdSearchData {
  loginId: string;
}

// DTO(데이터 전송 객체) 베이스 인터페이스 (알림 생성용)
export interface NotificationBase {
  receiverId: number;
  message: string;
}

// 친구 요청 알림 DTO 인터페이스
export interface FriendRequestNotificationDto extends NotificationBase {
  type: NotificationType.FRIEND_REQUEST;
}

// 게시물 좋아요 알림 DTO 인터페이스
export interface LikePostNotificationDto extends NotificationBase {
  type: NotificationType.LIKE_POST;
  postId: number;
}

// 댓글 알림 DTO 인터페이스
export interface CommentNotificationDto extends NotificationBase {
  type: NotificationType.COMMENT;
  postId: number;
}
// 댓글 좋아요 알림 DTO 인터페이스
export interface LikeCommentNotificationDto extends NotificationBase {
  type: NotificationType.LIKE_COMMENT;
  commentId: number;
}

// 알림 삭제 요청 DTO 인터페이스
export interface DeleteNotificationsDto {
  notificationIds: number[];
}
