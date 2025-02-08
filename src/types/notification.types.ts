export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  LIKE_POST = 'like_post',
  COMMENT = 'comment',
  LIKE_COMMENT = 'like_comment',
}

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

export interface NotificationCreateData {
  senderId: number;
  receiverId: number;
  type: NotificationType;
  message: string;
  postId?: number;
  commentId?: number;
}

export interface NotificationDeleteData {
  notificationIds: number[];
  userId: number;
}

export interface BaseResponse {
  statusCode: number;
  message: string;
}

export interface NotificationListResponse extends BaseResponse {
  notifications: NotificationInfo[];
}

export interface NotificationCreateResponse extends BaseResponse {
  notificationId: number;
}

export type NotificationUpdateResponse = BaseResponse;

export type NotificationDeleteResponse = BaseResponse;

export interface UserIdResponse extends BaseResponse {
  userId: number;
}

export interface UserIdByLoginIdResponse extends BaseResponse {
  userId: number;
}

export interface UserIdSearchData {
  loginId: string;
}

export interface NotificationBase {
  receiverId: number;
  message: string;
}

export interface FriendRequestNotificationDto extends NotificationBase {
  type: NotificationType.FRIEND_REQUEST;
}

export interface LikePostNotificationDto extends NotificationBase {
  type: NotificationType.LIKE_POST;
  postId: number;
}

export interface CommentNotificationDto extends NotificationBase {
  type: NotificationType.COMMENT;
  postId: number;
}

export interface LikeCommentNotificationDto extends NotificationBase {
  type: NotificationType.LIKE_COMMENT;
  commentId: number;
}

export interface DeleteNotificationsDto {
  notificationIds: number[];
}
