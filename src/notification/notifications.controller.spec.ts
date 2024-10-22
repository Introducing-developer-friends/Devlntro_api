import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import {
  CreateFriendRequestNotificationDto,
  CreateLikePostNotificationDto,
  CreateCommentNotificationDto,
  CreateLikeCommentNotificationDto,
  DeleteMultipleNotificationsDto,
} from './dto/notification.dto';


describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  // 각 테스트 전 모듈 및 서비스 설정
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

  // 컨트롤러 정의 확인
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // getNotifications 메서드 테스트
  describe('getNotifications', () => {
    it('should return notifications list', async () => {
      const req = { user: { userId: 1 } } as any;
      const notifications = [
        {
          notificationId: 1,
          type: 'comment',
          message: 'New comment',
          postId: 123,
          commentId: 456,
          isRead: false,
          createdAt: new Date(),
          senderId: 2,
        },
      ];

      // getNotifications 서비스 메서드 모킹
      jest.spyOn(service, 'getNotifications').mockResolvedValue({
        statusCode: 200,
        message: '알림 목록을 성공적으로 조회했습니다.',
        notifications,
      });

      const result = await controller.getNotifications(req);
      expect(result.notifications).toEqual(notifications);
    });
  });

  // markAsRead 메서드 테스트
  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const req = { user: { userId: 1 } } as any;
      jest.spyOn(service, 'markAsRead').mockResolvedValue({
        statusCode: 200,
        message: '알림이 성공적으로 읽음 처리되었습니다.',
      });

      const result = await controller.markAsRead(1, req);
      expect(result.message).toEqual('알림이 성공적으로 읽음 처리되었습니다.');
    });
  });

  // createFriendRequestNotification 메서드 테스트
  describe('createFriendRequestNotification', () => {
    it('should create a friend request notification', async () => {
      const dto: CreateFriendRequestNotificationDto = {
        receiverId: 2,
        message: 'You have a new friend request',
      };
      const req = { user: { userId: 1 } } as any; // mock 요청 객체
      const notification = {
        statusCode: 201,
        message: '친구 요청 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      // createNotification 서비스 메서드 모킹
      jest.spyOn(service, 'createNotification').mockResolvedValue(notification);

      const result = await controller.createFriendRequestNotification(dto, req);
      expect(result).toEqual(notification);
    });
  });

  // createLikePostNotification 메서드 테스트
  describe('createLikePostNotification', () => {
    it('should create a like post notification', async () => {
      const dto: CreateLikePostNotificationDto = {
        receiverId: 2,
        postId: 123,
        message: 'Someone liked your post',
      };
      const req = { user: { userId: 1 } } as any; // mock 요청 객체
      const notification = {
        statusCode: 201,
        message: '게시물 좋아요 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      // createNotification 서비스 메서드 모킹
      jest.spyOn(service, 'createNotification').mockResolvedValue(notification);

      const result = await controller.createLikePostNotification(dto, req);
      expect(result).toEqual(notification);
    });
  });

  // createCommentNotification 메서드 테스트
  describe('createCommentNotification', () => {
    it('should create a comment notification', async () => {
      const dto: CreateCommentNotificationDto = {
        receiverId: 2,
        postId: 123,
        message: 'Someone commented on your post',
      };
      const req = { user: { userId: 1 } } as any;
      const notification = {
        statusCode: 201,
        message: '댓글 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      // createNotification 서비스 메서드 모킹
      jest.spyOn(service, 'createNotification').mockResolvedValue(notification);

      const result = await controller.createCommentNotification(dto, req);
      expect(result).toEqual(notification);
    });
  });

  // deleteNotification 메서드 테스트
  describe('createLikeCommentNotification', () => {
    it('should create a like comment notification', async () => {
      const dto: CreateLikeCommentNotificationDto = {
        receiverId: 2,
        commentId: 456,
        message: 'Someone liked your comment',
      };
      const req = { user: { userId: 1 } } as any;
      const notification = {
        statusCode: 201,
        message: '댓글 좋아요 알림이 성공적으로 생성되었습니다.',
        notificationId: 1,
      };

      jest.spyOn(service, 'createNotification').mockResolvedValue(notification);

      const result = await controller.createLikeCommentNotification(dto, req);
      expect(result).toEqual(notification);
    });
  });

  // deleteNotification 메서드 테스트
  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const req = { user: { userId: 1 } } as any; // mock 요청 객체
      jest.spyOn(service, 'deleteNotification').mockResolvedValue({
        statusCode: 200,
        message: '알림이 성공적으로 삭제되었습니다.',
      });

      const result = await controller.deleteNotification(1, req);
      expect(result.message).toEqual('알림이 성공적으로 삭제되었습니다.');
    });
  });

  // deleteMultipleNotifications 메서드 테스트
  describe('deleteMultipleNotifications', () => {
    it('should delete multiple notifications', async () => {
      const dto: DeleteMultipleNotificationsDto = {
        notificationIds: [1, 2, 3],
      };
      const req = { user: { userId: 1 } } as any; // mock 요청 객체
      jest.spyOn(service, 'deleteMultipleNotifications').mockResolvedValue({
        statusCode: 200,
        message: '3개의 알림이 성공적으로 삭제되었습니다.',
      });

      const result = await controller.deleteMultipleNotifications(dto, req);
      expect(result.message).toEqual('3개의 알림이 성공적으로 삭제되었습니다.');
    });
  });

  // findUserIdByLoginId 메서드 테스트
  describe('findUserIdByLoginId', () => {
    it('should return userId for a given loginId', async () => {
      const loginId = 'user123';
      const response = { statusCode: 200, message: '사용자 ID를 성공적으로 조회했습니다.', userId: 1 };
      jest.spyOn(service, 'findUserIdByLoginId').mockResolvedValue(response);

      const result = await controller.findUserIdByLoginId(loginId);
      expect(result).toEqual(response);
    });
  });
});
