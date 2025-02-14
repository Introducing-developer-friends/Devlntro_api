import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { HttpStatus } from '@nestjs/common';
import { CreateFriendRequestNotificationDto } from './dto/create.friend.request.notification.dto';
import {
  NotificationListResponse,
  NotificationCreateResponse,
  NotificationType,
  UserIdResponse,
  NotificationInfo,
} from '../types/notification.types';
import { BaseResponse } from '../types/response.type';
import { DeleteMultipleNotificationsDto } from './dto/delete.multiple.notification.dto';
import { CreateCommentNotificationDto } from './dto/create.comment.notification.dto';
import { CreateLikePostNotificationDto } from './dto/create.like.post.notification.dto';
import { CreateLikeCommentNotificationDto } from './dto/create.like.comment.notification.dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockDate = new Date();

  const mockNotification: NotificationInfo = {
    notificationId: 1,
    type: NotificationType.COMMENT,
    message: 'New comment',
    postId: 123,
    commentId: 456,
    isRead: false,
    createdAt: mockDate,
    senderId: 2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            getNotifications: jest.fn(),
            markAsRead: jest.fn(),
            createNotification: jest.fn(),
            deleteNotification: jest.fn(),
            deleteMultipleNotifications: jest.fn(),
            findUserIdByLoginId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    const mockResponse: NotificationListResponse = {
      statusCode: HttpStatus.OK,
      message: '알림 목록을 성공적으로 조회했습니다.',
      notifications: [mockNotification],
    };

    it('should return notifications list', async () => {
      const req = { user: { userId: 1 } };
      jest
        .spyOn(service, 'getNotifications')
        .mockResolvedValue([mockNotification]);

      const result = await controller.getNotifications(req as any);
      expect(result).toEqual(mockResponse);
      expect(service.getNotifications).toHaveBeenCalledWith(1);
    });
  });

  describe('markAsRead', () => {
    const mockResponse: BaseResponse = {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 읽음 처리되었습니다.',
    };

    it('should mark a notification as read', async () => {
      const req = { user: { userId: 1 } };
      jest.spyOn(service, 'markAsRead').mockResolvedValue();

      const result = await controller.markAsRead(1, req);
      expect(result).toEqual(mockResponse);
      expect(service.markAsRead).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('createFriendRequestNotification', () => {
    it('should create a friend request notification', async () => {
      const req = { user: { userId: 1 } };
      const dto: CreateFriendRequestNotificationDto = {
        receiverId: 2,
        message: 'You have a new friend request',
        type: NotificationType.FRIEND_REQUEST,
      };

      const mockResponse: NotificationCreateResponse = {
        statusCode: HttpStatus.CREATED,
        message: '친구 요청 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      jest
        .spyOn(service, 'createNotification')
        .mockResolvedValue({ notificationId: 1 });

      const result = await controller.createFriendRequestNotification(req, dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createLikePostNotification', () => {
    it('should create a like post notification', async () => {
      const req = { user: { userId: 1 } };
      const dto: CreateLikePostNotificationDto = {
        receiverId: 2,
        postId: 123,
        message: 'Someone liked your post',
        type: NotificationType.LIKE_POST,
      };

      const mockResponse: NotificationCreateResponse = {
        statusCode: HttpStatus.CREATED,
        message: '게시물 좋아요 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      jest
        .spyOn(service, 'createNotification')
        .mockResolvedValue({ notificationId: 1 });

      const result = await controller.createLikePostNotification(dto, req);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createCommentNotification', () => {
    it('should create a comment notification', async () => {
      const req = { user: { userId: 1 } };
      const dto: CreateCommentNotificationDto = {
        receiverId: 2,
        postId: 123,
        message: 'Someone commented on your post',
        type: NotificationType.COMMENT,
      };

      const mockResponse: NotificationCreateResponse = {
        statusCode: HttpStatus.CREATED,
        message: '댓글 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      jest
        .spyOn(service, 'createNotification')
        .mockResolvedValue({ notificationId: 1 });

      const result = await controller.createCommentNotification(dto, req);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createLikeCommentNotification', () => {
    it('should create a like comment notification', async () => {
      const req = { user: { userId: 1 } };
      const dto: CreateLikeCommentNotificationDto = {
        receiverId: 2,
        commentId: 456,
        message: 'Someone liked your comment',
        type: NotificationType.LIKE_COMMENT,
      };

      const mockResponse: NotificationCreateResponse = {
        statusCode: HttpStatus.CREATED,
        message: '댓글 좋아요 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      jest
        .spyOn(service, 'createNotification')
        .mockResolvedValue({ notificationId: 1 });

      const result = await controller.createLikeCommentNotification(dto, req);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteNotification', () => {
    const mockResponse: BaseResponse = {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 삭제되었습니다.',
    };

    it('should delete a notification', async () => {
      const req = { user: { userId: 1 } };
      jest.spyOn(service, 'deleteNotification').mockResolvedValue();

      const result = await controller.deleteNotification(1, req);
      expect(result).toEqual(mockResponse);
      expect(service.deleteNotification).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('deleteMultipleNotifications', () => {
    it('should delete multiple notifications', async () => {
      const req = { user: { userId: 1 } };
      const dto: DeleteMultipleNotificationsDto = {
        notificationIds: [1, 2, 3],
      };

      const mockResponse: BaseResponse = {
        statusCode: HttpStatus.OK,
        message: '3개의 알림이 성공적으로 삭제되었습니다.',
      };

      jest.spyOn(service, 'deleteMultipleNotifications').mockResolvedValue(3);

      const result = await controller.deleteMultipleNotifications(dto, req);
      expect(result).toEqual(mockResponse);
      expect(service.deleteMultipleNotifications).toHaveBeenCalledWith(
        [1, 2, 3],
        1,
      );
    });
  });

  describe('findUserIdByLoginId', () => {
    it('should return userId for a given loginId', async () => {
      const loginId = 'user123';
      jest.spyOn(service, 'findUserIdByLoginId').mockResolvedValue(1);

      const mockResponse: UserIdResponse = {
        statusCode: HttpStatus.OK,
        message: '사용자 ID를 성공적으로 조회했습니다.',
        userId: 1,
      };

      const result = await controller.findUserIdByLoginId(loginId);
      expect(result).toEqual(mockResponse);
      expect(service.findUserIdByLoginId).toHaveBeenCalledWith(loginId);
    });
  });
});
