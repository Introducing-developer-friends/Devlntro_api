import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFriendRequestNotificationDto, CreateLikePostNotificationDto, CreateCommentNotificationDto, CreateLikeCommentNotificationDto, DeleteMultipleNotificationsDto } from './dto/notification.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

interface CustomRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiResponse({ status: 200, description: '알림 목록을 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 400, description: '알림 조회 중 오류가 발생했습니다.' })
  async getNotifications(@Req() req: CustomRequest) {
    return this.notificationsService.getNotifications(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '알림이 성공적으로 읽음 처리되었습니다.' })
  @ApiResponse({ status: 404, description: '해당 알림을 찾을 수 없습니다.' })
  async markAsRead(@Param('id') id: number, @Req() req: CustomRequest) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Post('friend-request')
  @ApiOperation({ summary: '친구 요청 알림 생성' })
  @ApiResponse({ status: 201, description: '친구 요청 알림이 성공적으로 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '친구 요청 알림 생성 중 오류가 발생했습니다.' })
  async createFriendRequestNotification(@Body() createNotificationDto: CreateFriendRequestNotificationDto, @Req() req: CustomRequest) {
    return this.notificationsService.createNotification(
      createNotificationDto.receiverId,
      'friend_request',
      createNotificationDto.message
    );
  }

  @Post('like-post')
  @ApiOperation({ summary: '게시물 좋아요 알림 생성' })
  @ApiResponse({ status: 201, description: '게시물 좋아요 알림이 성공적으로 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '게시물 좋아요 알림 생성 중 오류가 발생했습니다.' })
  async createLikePostNotification(@Body() createNotificationDto: CreateLikePostNotificationDto, @Req() req: CustomRequest) {
    return this.notificationsService.createNotification(
      createNotificationDto.receiverId,
      'like_post',
      createNotificationDto.message,
      createNotificationDto.postId
    );
  }

  @Post('comment')
  @ApiOperation({ summary: '댓글 알림 생성' })
  @ApiResponse({ status: 201, description: '댓글 알림이 성공적으로 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '댓글 알림 생성 중 오류가 발생했습니다.' })
  async createCommentNotification(@Body() createNotificationDto: CreateCommentNotificationDto, @Req() req: CustomRequest) {
    return this.notificationsService.createNotification(
      createNotificationDto.receiverId,
      'comment',
      createNotificationDto.message,
      createNotificationDto.postId
    );
  }

  @Post('like-comment')
  @ApiOperation({ summary: '댓글 좋아요 알림 생성' })
  @ApiResponse({ status: 201, description: '댓글 좋아요 알림이 성공적으로 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '댓글 좋아요 알림 생성 중 오류가 발생했습니다.' })
  async createLikeCommentNotification(@Body() createNotificationDto: CreateLikeCommentNotificationDto, @Req() req: CustomRequest) {
    return this.notificationsService.createNotification(
      createNotificationDto.receiverId,
      'like_comment',
      createNotificationDto.message,
      null,
      createNotificationDto.commentId
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  @ApiResponse({ status: 200, description: '알림이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 404, description: '해당 알림을 찾을 수 없습니다.' })
  async deleteNotification(@Param('id') id: number, @Req() req: CustomRequest) {
    return this.notificationsService.deleteNotification(id, req.user.userId);
  }

  @Delete()
  @ApiOperation({ summary: '여러 알림 삭제' })
  @ApiResponse({ status: 200, description: '선택한 알림들이 성공적으로 삭제되었습니다.' })
  @ApiResponse({ status: 400, description: '알림 삭제 중 오류가 발생했습니다.' })
  async deleteMultipleNotifications(@Body() deleteDto: DeleteMultipleNotificationsDto, @Req() req: CustomRequest) {
    return this.notificationsService.deleteMultipleNotifications(deleteDto.notificationIds, req.user.userId);
  }
}
