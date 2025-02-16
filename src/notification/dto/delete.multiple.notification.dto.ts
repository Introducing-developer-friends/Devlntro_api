import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class DeleteMultipleNotificationsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: '삭제할 알림 ID 배열',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  notificationIds: number[];
}
