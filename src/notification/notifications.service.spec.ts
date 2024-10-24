import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Repository, DeepPartial  } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  NotificationType,
  NotificationInfo,
  NotificationCreateData
} from '../types/notification.types';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<UserAccount>;
  let postRepository: Repository<Post>;
  let commentRepository: Repository<Comment>;

  const mockDate = new Date();

  // 모의 UserAccount 데이터 설정
  const mockUser: Partial<UserAccount> = {
    user_id: 1,
    login_id: 'test',
    password: 'password',
    confirm_password: 'password',
    name: 'Test User',
    deletedAt: null,
    profile: null,
    contacts: [],
    contactOf: [],
    posts: [],
    comments: [],
    postLikes: [],
    sentFriendRequests: [],
    receivedFriendRequests: [],
    notifications: []
  };

  // 테스트 시작 전 모듈과 서비스 설정
  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([])
    };

    // 테스트 모듈 컴파일
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            update: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            softRemove: jest.fn(),
            findOne: jest.fn()
          },
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: {
            findOne: jest.fn()
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            findOne: jest.fn()
          },
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            findOne: jest.fn()
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    userRepository = module.get<Repository<UserAccount>>(getRepositoryToken(UserAccount));
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    commentRepository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
  });

  // 서비스 정의 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // getNotifications 메서드 테스트
  describe('getNotifications', () => {

    // 알림 목록을 성공적으로 반환하는지 테스트
    it('should return notifications list', async () => {

      // 모의 알림 데이터 설정
      const mockNotification = {
        id: 1,
        type: NotificationType.COMMENT,
        message: 'New comment',
        isRead: false,
        createdAt: mockDate,
        senderId: 123,
        user: mockUser as UserAccount,
        post: { post_id: 10 },
        comment: { comment_id: 20 }
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockNotification])
      };

      jest.spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getNotifications(1);

      // 반환된 알림 목록이 올바른지 확인
      expect(result).toEqual([{
        notificationId: mockNotification.id,
        type: mockNotification.type,
        message: mockNotification.message,
        postId: mockNotification.post?.post_id,
        commentId: mockNotification.comment?.comment_id,
        isRead: mockNotification.isRead,
        createdAt: mockNotification.createdAt,
        senderId: mockNotification.senderId
      }]);
    });

    // 오류 발생 시 BadRequestException을 던지는지 테스트
    it('should throw BadRequestException on error', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error())
      };

      jest.spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.getNotifications(1))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  // markAsRead 메서드 테스트
  describe('markAsRead', () => {

    // 알림을 읽음 처리하는지 테스트
    it('should mark notification as read', async () => {
      jest.spyOn(notificationRepository, 'update')
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.markAsRead(1, 1);
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { id: 1, user: { user_id: 1 } },
        { isRead: true }
      );
    });

    // 알림이 없을 경우 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(notificationRepository, 'update')
        .mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(service.markAsRead(1, 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // createNotification 메서드 테스트
  describe('createNotification', () => {
    const createData: NotificationCreateData = {
      senderId: 1,
      receiverId: 2,
      type: NotificationType.COMMENT,
      message: 'Test message',
      postId: 1
    };

    // 알림을 성공적으로 생성하는지 테스트
    it('should create notification successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as UserAccount);
      jest.spyOn(postRepository, 'findOne').mockResolvedValue({ post_id: 1, user: mockUser } as Post);
      jest.spyOn(notificationRepository, 'create').mockReturnValue({ id: 1 } as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue({ id: 1 } as Notification);

      const result = await service.createNotification(createData);
      expect(result).toEqual({ notificationId: 1 });
    });

    // 발신자와 수신자가 같으면 BadRequestException을 던지는지 테스트
    it('should throw BadRequestException if sender and receiver are same', async () => {
      const invalidData = { ...createData, receiverId: 1 };
      await expect(service.createNotification(invalidData))
        .rejects
        .toThrow(BadRequestException);
    });

    // 수신자가 없을 경우 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException if receiver not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(service.createNotification(createData))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // deleteNotification 메서드 테스트  
  describe('deleteNotification', () => {

    // 알림을 성공적으로 삭제하는지 테스트
    it('should delete notification', async () => {
      jest.spyOn(notificationRepository, 'softDelete')
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.deleteNotification(1, 1);
      expect(notificationRepository.softDelete).toHaveBeenCalledWith({
        id: 1,
        user: { user_id: 1 }
      });
    });

    // 알림이 없을 경우 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(notificationRepository, 'softDelete')
        .mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(service.deleteNotification(1, 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // deleteMultipleNotifications 메서드 테스트
  describe('deleteMultipleNotifications', () => {

    // 여러 알림을 성공적으로 삭제하는지 테스트
    it('should delete multiple notifications', async () => {
      const mockNotification = {
        id: 1,
        user: mockUser,
        type: NotificationType.COMMENT,
        message: 'test',
        isRead: false,
        createdAt: mockDate,
        senderId: 123,
        post: null,
        comment: null,
        deletedAt: null
      };

      const mockNotifications = [
        { ...mockNotification, id: 1 },
        { ...mockNotification, id: 2 },
        { ...mockNotification, id: 3 }
      ];

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotifications)
      };

      jest.spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      // softRemove 메서드 모킹을 Promise.resolve로 변경
      jest.spyOn(notificationRepository, 'softRemove')
        .mockImplementation(() => Promise.resolve(mockNotifications as any));

      const result = await service.deleteMultipleNotifications([1, 2, 3], 1);
      expect(result).toBe(3);
    });

    // 알림이 없을 경우 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException if no notifications found', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };

      jest.spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.deleteMultipleNotifications([1, 2, 3], 1))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // findUserIdByLoginId 메서드 테스트
  describe('findUserIdByLoginId', () => {
    it('should return user id when user found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as UserAccount);

      const result = await service.findUserIdByLoginId('test');
      expect(result).toBe(1);
    });

    // 사용자가 존재하지 않을 경우 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findUserIdByLoginId('test'))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});