import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../types/notification.types';

export class CreateFriendRequestNotificationDto {
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
