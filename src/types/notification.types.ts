import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from './response.type';

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  LIKE_POST = 'like_post',
  COMMENT = 'comment',
  LIKE_COMMENT = 'like_comment',
}

export class NotificationInfo {
  @ApiProperty({ example: 1 })
  notificationId: number;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ example: '새로운 알림이 있습니다.' })
  message: string;

  @ApiProperty({ required: false, example: 1 })
  postId?: number;

  @ApiProperty({ required: false, example: 1 })
  commentId?: number;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: new Date() })
  createdAt: Date;

  @ApiProperty({ example: 1 })
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

export class NotificationListResponse extends BaseResponse {
  @ApiProperty({ type: [NotificationInfo] })
  notifications: NotificationInfo[];
}

export class NotificationCreateResponse extends BaseResponse {
  @ApiProperty({ example: 1 })
  notificationId: number;
}

export class UserIdResponse extends BaseResponse {
  @ApiProperty({ example: 1 })
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
