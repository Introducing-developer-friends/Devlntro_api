import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { NotificationType } from '../../types/notification.types';

export class CreateLikeCommentNotificationDto {
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
