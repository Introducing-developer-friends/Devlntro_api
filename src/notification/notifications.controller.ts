import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateFriendRequestNotificationDto,
  CreateLikePostNotificationDto,
  CreateCommentNotificationDto,
  CreateLikeCommentNotificationDto,
  DeleteMultipleNotificationsDto,
} from './dto/notification.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import {
  NotificationListResponse,
  NotificationCreateResponse,
  NotificationUpdateResponse,
  NotificationDeleteResponse,
  NotificationType,
  UserIdResponse,
} from '../types/notification.types';
interface CustomRequest extends Request {
  user: {
    userId: number;
  };
}
// 알림 관련 API 컨트롤러@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림 목록을 성공적으로 조회했습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '알림 조회 중 오류가 발생했습니다.',
  })
  async getNotifications(
    @Req() req: CustomRequest,
  ): Promise<NotificationListResponse> {
    const notifications = await this.notificationsService.getNotifications(
      req.user.userId,
    );

    // 응답 반환
    return {
      statusCode: HttpStatus.OK,
      message: '알림 목록을 성공적으로 조회했습니다.',
      notifications,
    };
  }

  // 알림 읽음 처리 API
  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림이 성공적으로 읽음 처리되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 알림을 찾을 수 없습니다.',
  })
  async markAsRead(
    @Param('id') id: number,
    @Req() req: CustomRequest,
  ): Promise<NotificationUpdateResponse> {
    await this.notificationsService.markAsRead(id, req.user.userId);

    return {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 읽음 처리되었습니다.',
    };
  }

  // 친구 요청 알림 생성 API
  @Post('friend-request')
  @ApiOperation({ summary: '친구 요청 알림 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '친구 요청 알림이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '친구 요청 알림 생성 중 오류가 발생했습니다.',
  })
  async createFriendRequestNotification(
    @Req() req: CustomRequest,
    @Body() dto: CreateFriendRequestNotificationDto,
  ): Promise<NotificationCreateResponse> {
    const result = await this.notificationsService.createNotification({
      senderId: req.user.userId,
      receiverId: dto.receiverId,
      type: NotificationType.FRIEND_REQUEST,
      message: dto.message,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: '친구 요청 알림이 성공적으로 생성되었습니다.',
      notificationId: result.notificationId,
    };
  }

  // 게시물 좋아요 알림 생성 API
  @Post('like-post')
  @ApiOperation({ summary: '게시물 좋아요 알림 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '게시물 좋아요 알림이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '알림을 받을 사용자를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 게시물을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '게시물 좋아요 알림 생성 중 오류가 발생했습니다.',
  })
  async createLikePostNotification(
    @Body() dto: CreateLikePostNotificationDto,
    @Req() req: CustomRequest,
  ): Promise<NotificationCreateResponse> {
    const result = await this.notificationsService.createNotification({
      senderId: req.user.userId,
      receiverId: dto.receiverId,
      type: NotificationType.LIKE_POST,
      message: dto.message,
      postId: dto.postId,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시물 좋아요 알림이 성공적으로 생성되었습니다.',
      notificationId: result.notificationId,
    };
  }

  // 댓글 알림 생성 API
  @Post('comment')
  @ApiOperation({ summary: '댓글 알림 생성' })
  @ApiResponse({
    status: 201,
    description: '댓글 알림이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '알림을 받을 사용자를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 댓글을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '댓글 알림 생성 중 오류가 발생했습니다.',
  })
  async createCommentNotification(
    @Body() dto: CreateCommentNotificationDto,
    @Req() req: CustomRequest,
  ): Promise<NotificationCreateResponse> {
    const result = await this.notificationsService.createNotification({
      senderId: req.user.userId,
      receiverId: dto.receiverId,
      type: NotificationType.COMMENT,
      message: dto.message,
      postId: dto.postId,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글 알림이 성공적으로 생성되었습니다.',
      notificationId: result.notificationId,
    };
  }

  // 댓글 좋아요 알림 생성 API
  @Post('like-comment')
  @ApiOperation({ summary: '댓글 좋아요 알림 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '댓글 좋아요 알림이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '알림을 받을 사용자를 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 댓글을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '댓글 좋아요 알림 생성 중 오류가 발생했습니다.',
  })
  async createLikeCommentNotification(
    @Body() dto: CreateLikeCommentNotificationDto,
    @Req() req: CustomRequest,
  ): Promise<NotificationCreateResponse> {
    const result = await this.notificationsService.createNotification({
      senderId: req.user.userId,
      receiverId: dto.receiverId,
      type: NotificationType.LIKE_COMMENT,
      message: dto.message,
      commentId: dto.commentId,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: '댓글 좋아요 알림이 성공적으로 생성되었습니다.',
      notificationId: result.notificationId,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 알림을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '알림 삭제 중 오류가 발생했습니다.',
  })
  async deleteNotification(
    @Param('id') id: number,
    @Req() req: CustomRequest,
  ): Promise<NotificationDeleteResponse> {
    await this.notificationsService.deleteNotification(id, req.user.userId);

    return {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 삭제되었습니다.',
    };
  }

  @Delete()
  @ApiOperation({ summary: '여러 알림 삭제' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '선택한 알림들이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '삭제할 알림을 찾을 수 없습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '알림 삭제 중 오류가 발생했습니다.',
  })
  async deleteMultipleNotifications(
    @Body() dto: DeleteMultipleNotificationsDto,
    @Req() req: CustomRequest,
  ): Promise<NotificationDeleteResponse> {
    const deletedCount =
      await this.notificationsService.deleteMultipleNotifications(
        dto.notificationIds,
        req.user.userId,
      );

    return {
      statusCode: HttpStatus.OK,
      message: `${deletedCount}개의 알림이 성공적으로 삭제되었습니다.`,
    };
  }

  // 로그인 ID로 userId 조회
  @Post('find-user-id')
  @ApiOperation({ summary: '로그인 ID로 사용자 ID 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그인 ID로 사용자 ID를 성공적으로 조회했습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 로그인 ID에 해당하는 사용자를 찾을 수 없습니다.',
  })
  async findUserIdByLoginId(
    @Body('login_id') loginId: string,
  ): Promise<UserIdResponse> {
    const userId = await this.notificationsService.findUserIdByLoginId(loginId);

    return {
      statusCode: HttpStatus.OK,
      message: '사용자 ID를 성공적으로 조회했습니다.',
      userId,
    };
  }
}
