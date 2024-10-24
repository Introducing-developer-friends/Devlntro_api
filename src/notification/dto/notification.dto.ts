import { IsNotEmpty, IsNumber, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { 
  NotificationType,
  FriendRequestNotificationDto,
  LikePostNotificationDto,
  CommentNotificationDto,
  LikeCommentNotificationDto,
  DeleteNotificationsDto
 } from '../../types/notification.types';
// 친구 요청 알림 생성을 위한 DTO
export class CreateFriendRequestNotificationDto implements FriendRequestNotificationDto {
  @ApiProperty({
    example: 2,
    description: '친구 요청을 받은 사용자의 ID',
  })
  @IsNotEmpty()
  @IsNumber()
  receiverId: number;

  @ApiProperty({
    example: '홍길동님이 친구 요청을 보냈습니다.',
    description: '알림 메시지',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  type: NotificationType.FRIEND_REQUEST = NotificationType.FRIEND_REQUEST;
}

// 게시물 좋아요 알림 생성을 위한 DTO

export class CreateLikePostNotificationDto implements LikePostNotificationDto {
  @ApiProperty({
    example: 2,
    description: '게시물 작성자의 ID (알림을 받을 사용자)',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  receiverId: number;

  @ApiProperty({
    example: 123,
    description: '좋아요가 눌린 게시물의 ID',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  postId: number;

  @ApiProperty({
    example: '김철수님이 당신의 게시물에 좋아요를 눌렀습니다.',
    description: '알림 메시지',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  message: string;
  type: NotificationType.LIKE_POST = NotificationType.LIKE_POST;
}

// 댓글 알림 생성을 위한 DTO
export class CreateCommentNotificationDto implements CommentNotificationDto {

  @ApiProperty({
    example: 2,
    description: '게시물 작성자의 ID (알림을 받을 사용자)',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  receiverId: number;

  @ApiProperty({
    example: 123,
    description: '댓글이 작성된 게시물의 ID',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  postId: number;

  @ApiProperty({
    example: '이영희님이 당신의 게시물에 댓글을 남겼습니다.',
    description: '알림 메시지',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  message: string;
  type: NotificationType.COMMENT = NotificationType.COMMENT;
}

// 댓글 좋아요 알림 생성을 위한 DTO
export class CreateLikeCommentNotificationDto implements LikeCommentNotificationDto {

  @ApiProperty({
    example: 2,
    description: '댓글 작성자의 ID (알림을 받을 사용자)',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  receiverId: number;

  @ApiProperty({
    example: 789,
    description: '좋아요가 눌린 댓글의 ID',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  commentId: number;

  @ApiProperty({
    example: '김철수님이 당신의 댓글에 좋아요를 눌렀습니다.',
    description: '알림 메시지',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  message: string;
  type: NotificationType.LIKE_COMMENT = NotificationType.LIKE_COMMENT;
}

// 다수의 알림 삭제를 위한 DTO
export class DeleteMultipleNotificationsDto implements DeleteNotificationsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: '삭제할 알림 ID 배열',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  notificationIds: number[];
}