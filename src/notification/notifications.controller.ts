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
import { CreateFriendRequestNotificationDto } from './dto/create.friend.request.notification.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  NotificationListResponse,
  NotificationCreateResponse,
  NotificationType,
  UserIdResponse,
} from '../types/notification.types';
import {
  BadRequestResponse,
  BaseResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from '../types/response.type';
import { ErrorMessageType } from '../enums/error.message.enum';
import { DeleteMultipleNotificationsDto } from './dto/delete.multiple.notification.dto';
import { CreateCommentNotificationDto } from './dto/create.comment.notification.dto';
import { CreateLikePostNotificationDto } from './dto/create.like.post.notification.dto';
import { CreateLikeCommentNotificationDto } from './dto/create.like.comment.notification.dto';
import { CustomRequest } from '../types/request.type';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiOkResponse({
    type: NotificationListResponse,
    description: '알림 목록을 성공적으로 조회했습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  async getNotifications(
    @Req() req: CustomRequest,
  ): Promise<NotificationListResponse> {
    const notifications = await this.notificationsService.getNotifications(
      req.user.userId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '알림 목록을 성공적으로 조회했습니다.',
      notifications,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiOkResponse({
    type: BaseResponse,
    description: '알림이 성공적으로 읽음 처리되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_NOTIFICATION,
  })
  async markAsRead(
    @Param('id') id: number,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    await this.notificationsService.markAsRead(id, req.user.userId);

    return {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 읽음 처리되었습니다.',
    };
  }

  @Post('friend-request')
  @ApiOperation({ summary: '친구 요청 알림 생성' })
  @ApiCreatedResponse({
    type: NotificationCreateResponse,
    description: '친구 요청 알림이 성공적으로 생성되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
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

  @Post('like-post')
  @ApiOperation({ summary: '게시물 좋아요 알림 생성' })
  @ApiCreatedResponse({
    type: NotificationCreateResponse,
    description: '게시물 좋아요 알림이 성공적으로 생성되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.NOT_FOUND_USER,
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_POST,
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

  @Post('comment')
  @ApiOperation({ summary: '댓글 알림 생성' })
  @ApiCreatedResponse({
    type: NotificationCreateResponse,
    description: '댓글 알림이 성공적으로 생성되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.NOT_FOUND_USER,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_COMMENT,
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
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

  @Post('like-comment')
  @ApiOperation({ summary: '댓글 좋아요 알림 생성' })
  @ApiCreatedResponse({
    type: NotificationCreateResponse,
    description: '댓글 좋아요 알림이 성공적으로 생성되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_COMMENT,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_USER,
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
  @ApiOkResponse({
    type: BaseResponse,
    description: '알림이 성공적으로 삭제되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_NOTIFICATION,
  })
  async deleteNotification(
    @Param('id') id: number,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    await this.notificationsService.deleteNotification(id, req.user.userId);

    return {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 삭제되었습니다.',
    };
  }

  @Delete()
  @ApiOperation({ summary: '여러 알림 삭제' })
  @ApiOkResponse({
    type: BaseResponse,
    description: '선택한 알림들이 성공적으로 삭제되었습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_NOTIFICATION,
  })
  async deleteMultipleNotifications(
    @Body() dto: DeleteMultipleNotificationsDto,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
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

  @Post('find-user-id')
  @ApiOperation({ summary: '로그인 ID로 사용자 ID 조회' })
  @ApiOkResponse({
    type: UserIdResponse,
    description: '로그인 ID로 사용자 ID를 성공적으로 조회했습니다.',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponse,
    description: ErrorMessageType.BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponse,
    description: ErrorMessageType.INVALID_AUTH,
  })
  @ApiNotFoundResponse({
    type: NotFoundResponse,
    description: ErrorMessageType.NOT_FOUND_USER,
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
