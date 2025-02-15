import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { NotificationType } from '../../types/notification.types';

export class CreateCommentNotificationDto {
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
