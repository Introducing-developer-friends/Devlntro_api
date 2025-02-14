import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  NotificationType,
  NotificationCreateData,
} from '../types/notification.types';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<UserAccount>;
  let postRepository: Repository<Post>;
  let commentRepository: Repository<Comment>;

  const mockDate = new Date();

  const mockUser: Partial<UserAccount> = {
    user_id: 1,
    login_id: 'test',
    password: 'password',
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
    notifications: [],
  };

  const createMockQueryBuilder = () => ({
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
    softDelete: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: {
            createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    userRepository = module.get<Repository<UserAccount>>(
      getRepositoryToken(UserAccount),
    );
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotifications', () => {
    const mockNotification = {
      notification_id: 1,
      type: NotificationType.COMMENT,
      message: 'New comment',
      isRead: false,
      createdAt: mockDate,
      sender: mockUser,
      receiver: { ...mockUser, user_id: 2 },
      post: { post_id: 10 },
      comment: { comment_id: 20 },
    };

    it('should return notifications list', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([mockNotification]);

      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getNotifications(2);
      expect(result[0].senderId).toBe(mockUser.user_id);
    });

    it('should handle empty notifications list', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);
      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.getNotifications(1);
      expect(result).toEqual([]);
    });

    it('should throw BadRequestException on error', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(new Error('Database error'));
      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.getNotifications(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.execute.mockResolvedValue({ affected: 1 });
      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await service.markAsRead(1, 1);
      expect(queryBuilder.update).toHaveBeenCalled();
      expect(queryBuilder.set).toHaveBeenCalledWith({ isRead: true });
    });

    it('should throw NotFoundException if notification not found', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.execute.mockResolvedValue({ affected: 0 });
      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.markAsRead(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.execute.mockRejectedValue(new Error('Database error'));
      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.markAsRead(1, 1)).rejects.toThrow(Error);
    });

    it('should handle database error during mark as read', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.execute.mockRejectedValue(new Error('Database error'));
      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.markAsRead(1, 1)).rejects.toThrow(Error);
    });
  });

  describe('createNotification', () => {
    const createData: NotificationCreateData = {
      senderId: 1,
      receiverId: 2,
      type: NotificationType.COMMENT,
      message: 'Test message',
      postId: 1,
    };

    it('should create notification successfully', async () => {
      const mockReceiver = { ...mockUser, user_id: 2 };
      const mockSender = { ...mockUser, user_id: 1 };

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([mockSender, mockReceiver]);

      const mockNotification = {
        notification_id: 1,
        sender: mockSender,
        receiver: mockReceiver,
      };

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest
        .spyOn(postRepository, 'findOne')
        .mockResolvedValue({ post_id: 1, user: mockUser } as Post);
      jest
        .spyOn(notificationRepository, 'create')
        .mockReturnValue(mockNotification as Notification);
      jest
        .spyOn(notificationRepository, 'save')
        .mockResolvedValue(mockNotification as Notification);

      const result = await service.createNotification(createData);
      expect(result).toEqual({ notificationId: 1 });
    });

    it('should throw BadRequestException for invalid post', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([{ user_id: 1 }, { user_id: 2 }]);

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest.spyOn(postRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createNotification(createData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid comment', async () => {
      const dataWithComment = {
        ...createData,
        commentId: 1,
      };

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([{ user_id: 1 }, { user_id: 2 }]);

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createNotification(dataWithComment)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when sender and receiver are same', async () => {
      const sameUserData: NotificationCreateData = {
        senderId: 1,
        receiverId: 1,
        type: NotificationType.COMMENT,
        message: 'Test message',
        postId: 1,
      };

      await expect(service.createNotification(sameUserData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle database error during notification creation', async () => {
      const createData: NotificationCreateData = {
        senderId: 1,
        receiverId: 2,
        type: NotificationType.COMMENT,
        message: 'Test message',
        postId: 1,
      };

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([{ user_id: 1 }, { user_id: 2 }]);

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);
      jest
        .spyOn(postRepository, 'findOne')
        .mockResolvedValue({ post_id: 1 } as Post);
      jest
        .spyOn(notificationRepository, 'save')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.createNotification(createData)).rejects.toThrow(
        Error,
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      jest
        .spyOn(notificationRepository, 'softDelete')
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.deleteNotification(1, 1);
      expect(notificationRepository.softDelete).toHaveBeenCalledWith({
        notification_id: 1,
        receiver: { user_id: 1 },
      });
    });

    it('should throw NotFoundException if notification not found', async () => {
      jest
        .spyOn(notificationRepository, 'softDelete')
        .mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database error during deletion', async () => {
      jest
        .spyOn(notificationRepository, 'softDelete')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.deleteNotification(1, 1)).rejects.toThrow(Error);
    });
  });

  describe('deleteMultipleNotifications', () => {
    it('should delete multiple notifications', async () => {
      const mockNotifications = [
        { notification_id: 1 },
        { notification_id: 2 },
      ];

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockNotifications);
      queryBuilder.execute.mockResolvedValue({ affected: 2 });

      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.deleteMultipleNotifications([1, 2], 1);
      expect(result).toBe(2);
    });

    it('should throw NotFoundException when no notifications found', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);

      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(
        service.deleteMultipleNotifications([1, 2], 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle partial deletion', async () => {
      const mockNotifications = [{ notification_id: 1 }];

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockNotifications);
      queryBuilder.execute.mockResolvedValue({ affected: 1 });

      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.deleteMultipleNotifications([1, 2], 1);
      expect(result).toBe(1);
    });

    it('should handle database error during deletion query', async () => {
      const mockNotifications = [
        { notification_id: 1 },
        { notification_id: 2 },
      ];

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockNotifications);
      queryBuilder.execute.mockRejectedValue(new Error('Database error'));

      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(
        service.deleteMultipleNotifications([1, 2], 1),
      ).rejects.toThrow(Error);
    });

    it('should return 0 when no notifications were deleted', async () => {
      const mockNotifications = [
        { notification_id: 1 },
        { notification_id: 2 },
      ];

      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockNotifications);
      queryBuilder.execute.mockResolvedValue({ affected: 0 });

      jest
        .spyOn(notificationRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.deleteMultipleNotifications([1, 2], 1);
      expect(result).toBe(0);
    });
  });

  describe('findUserIdByLoginId', () => {
    it('should return user id when user found', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(mockUser);

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await service.findUserIdByLoginId('test');
      expect(result).toBe(mockUser.user_id);
    });

    it('should throw NotFoundException when user not found', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getOne.mockResolvedValue(null);

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.findUserIdByLoginId('test')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database errors', async () => {
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getOne.mockRejectedValue(new Error('Database error'));

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(service.findUserIdByLoginId('test')).rejects.toThrow(Error);
    });
  });
});
