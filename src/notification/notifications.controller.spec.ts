import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { HttpStatus } from '@nestjs/common';
import {
  CreateFriendRequestNotificationDto,
  CreateLikePostNotificationDto,
  CreateCommentNotificationDto,
  CreateLikeCommentNotificationDto,
  DeleteMultipleNotificationsDto,
} from './dto/notification.dto';
import {
  NotificationListResponse,
  NotificationCreateResponse,
  NotificationUpdateResponse,
  NotificationDeleteResponse,
  NotificationType,
  UserIdResponse,
  NotificationInfo,
} from '../types/notification.types';

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

  // 각 테스트 전 모듈 및 서비스 설정
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          // 서비스에 대한 모의 객체(mock)를 제공
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

  // 컨트롤러 정의 확인
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // getNotifications 메서드 테스트
  describe('getNotifications', () => {
    const mockResponse: NotificationListResponse = {
      statusCode: HttpStatus.OK,
      message: '알림 목록을 성공적으로 조회했습니다.',
      notifications: [mockNotification],
    };

    // 알림 목록을 반환하는지 확인
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

  // markAsRead 메서드 테스트
  describe('markAsRead', () => {
    const mockResponse: NotificationUpdateResponse = {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 읽음 처리되었습니다.',
    };

    // 알림을 읽음으로 처리하는지 확인
    it('should mark a notification as read', async () => {
      const req = { user: { userId: 1 } };
      jest.spyOn(service, 'markAsRead').mockResolvedValue();

      const result = await controller.markAsRead(1, req as any);
      expect(result).toEqual(mockResponse);
      expect(service.markAsRead).toHaveBeenCalledWith(1, 1);
    });
  });

  // createFriendRequestNotification 메서드 테스트
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

      const result = await controller.createFriendRequestNotification(
        req as any,
        dto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // createLikePostNotification 메서드 테스트
  describe('createLikePostNotification', () => {
    // 친구 요청 알림을 생성하는지 확인
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

      const result = await controller.createLikePostNotification(
        dto,
        req as any,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // createCommentNotification 메서드 테스트
  describe('createCommentNotification', () => {
    // 게시물 좋아요 알림을 생성하는지 확인
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

      const result = await controller.createCommentNotification(
        dto,
        req as any,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // deleteNotification 메서드 테스트
  describe('createLikeCommentNotification', () => {
    // 댓글 알림을 생성하는지 확인
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

      const result = await controller.createLikeCommentNotification(
        dto,
        req as any,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // deleteNotification 메서드 테스트
  describe('deleteNotification', () => {
    const mockResponse: NotificationDeleteResponse = {
      statusCode: HttpStatus.OK,
      message: '알림이 성공적으로 삭제되었습니다.',
    };

    // 알림을 삭제하는지 확인
    it('should delete a notification', async () => {
      const req = { user: { userId: 1 } };
      jest.spyOn(service, 'deleteNotification').mockResolvedValue();

      const result = await controller.deleteNotification(1, req as any);
      expect(result).toEqual(mockResponse);
      expect(service.deleteNotification).toHaveBeenCalledWith(1, 1);
    });
  });

  // deleteMultipleNotifications 메서드 테스트
  describe('deleteMultipleNotifications', () => {
    // 여러 알림을 삭제하는지 확인
    it('should delete multiple notifications', async () => {
      const req = { user: { userId: 1 } };
      const dto: DeleteMultipleNotificationsDto = {
        notificationIds: [1, 2, 3],
      };

      const mockResponse: NotificationDeleteResponse = {
        statusCode: HttpStatus.OK,
        message: '3개의 알림이 성공적으로 삭제되었습니다.',
      };

      jest.spyOn(service, 'deleteMultipleNotifications').mockResolvedValue(3);

      const result = await controller.deleteMultipleNotifications(
        dto,
        req as any,
      );
      expect(result).toEqual(mockResponse);
      expect(service.deleteMultipleNotifications).toHaveBeenCalledWith(
        [1, 2, 3],
        1,
      );
    });
  });

  // findUserIdByLoginId 메서드 테스트
  describe('findUserIdByLoginId', () => {
    // loginId에 해당하는 사용자 ID를 반환하는지 확인
    it('should return userId for a given loginId', async () => {
      const loginId = 'user123';
      jest.spyOn(service, 'findUserIdByLoginId').mockResolvedValue(1);

      const mockResponse: UserIdResponse = {
        statusCode: HttpStatus.OK,
        message: '사용자 ID를 성공적으로 조회했습니다.',
        userId: 1,
      };

      const result = await controller.findUserIdByLoginId(loginId);
      expect(result).toEqual(mockResponse); // 반환값 확인
      expect(service.findUserIdByLoginId).toHaveBeenCalledWith(loginId);
    });
  });
});
