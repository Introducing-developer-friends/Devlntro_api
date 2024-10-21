import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock 객체 설정
const mockNotificationRepository = {
  find: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  softRemove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  }),
};

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockPostRepository = {
  findOne: jest.fn(),
};

const mockCommentRepository = {
  findOne: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<UserAccount>;
  let postRepository: Repository<Post>;
  let commentRepository: Repository<Comment>;

  // 테스트 시작 전 모듈과 서비스 설정
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepository },
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepository },
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepository },
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
    it('should return notifications list', async () => {
      const notifications: Partial<Notification>[] = [{
        id: 1,
        type: 'comment',
        message: 'New comment',
        isRead: false,
        createdAt: new Date(),
        senderId: 123,
        deletedAt: null,
        user: { user_id: 1 } as UserAccount,
        post: { post_id: 10 } as Post,
        comment: { comment_id: 20 } as Comment,
      }];

      // getMany 메서드 모킹
      jest.spyOn(notificationRepository.createQueryBuilder(), 'getMany').mockResolvedValue(notifications as Notification[]);

      const result = await service.getNotifications(1);
      expect(result.notifications).toEqual(notifications.map(n => ({
        notificationId: n.id,
        type: n.type,
        message: n.message,
        postId: n.post?.post_id,
        commentId: n.comment?.comment_id,
        isRead: n.isRead,
        createdAt: n.createdAt,
        senderId: n.senderId,
      })));
    });

    // 예외 처리 테스트
    it('should throw BadRequestException if error occurs', async () => {
      
        // 예외를 발생시키도록 설정
        jest.spyOn(notificationRepository.createQueryBuilder(), 'getMany').mockRejectedValue(new Error());
      await expect(service.getNotifications(1)).rejects.toThrow(BadRequestException);
    });
  });

  // markAsRead 메서드 테스트
  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      jest.spyOn(notificationRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.markAsRead(1, 1);
      expect(result.message).toEqual('알림이 성공적으로 읽음 처리되었습니다.');
    });

    // 알림을 찾을 수 없는 경우 테스트
    it('should throw NotFoundException if no notification is found', async () => {
      jest.spyOn(notificationRepository, 'update').mockResolvedValue({ affected: 0 } as any);
      await expect(service.markAsRead(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // createNotification 메서드 테스트
  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const receiver: Partial<UserAccount> = { 
        user_id: 2, 
        login_id: 'user2', 
        password: 'pass123', 
        confirm_password: 'pass123', 
        name: 'User Two',
      };

      // UserAccount 조회 및 Notification 생성 모킹
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(receiver as UserAccount);
      jest.spyOn(notificationRepository, 'create').mockReturnValue({ id: 1 } as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue({ id: 1 } as Notification);

      const result = await service.createNotification(1, 2, 'comment', 'New comment');
      expect(result.notificationId).toEqual(1);
    });

    // 수신자를 찾을 수 없는 경우 테스트
    it('should throw BadRequestException if receiver is not found', async () => {
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
        await expect(service.createNotification(1, 2, 'comment', 'New comment')).rejects.toThrow(BadRequestException);
      });
    });

  // deleteNotification 메서드 테스트  
  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      jest.spyOn(notificationRepository, 'softDelete').mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteNotification(1, 1);
      expect(result.message).toEqual('알림이 성공적으로 삭제되었습니다.');
    });

    it('should throw NotFoundException if no notification is found', async () => {
      jest.spyOn(notificationRepository, 'softDelete').mockResolvedValue({ affected: 0 } as any);
      await expect(service.deleteNotification(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // deleteMultipleNotifications 메서드 테스트
  describe('deleteMultipleNotifications', () => {
    it('should delete multiple notifications', async () => {
      const notifications = [
        { id: 1, user: { user_id: 1 } },
        { id: 2, user: { user_id: 1 } },
        { id: 3, user: { user_id: 1 } }
      ] as Notification[];
  
      const queryBuilderMock = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(notifications)
      };
  
      jest.spyOn(notificationRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);
      jest.spyOn(notificationRepository, 'softRemove').mockResolvedValue(notifications as any);
  
      const result = await service.deleteMultipleNotifications([1, 2, 3], 1);
      expect(result.message).toEqual('3개의 알림이 성공적으로 삭제되었습니다.');
    });
    
    // 예외 발생 테스트
    it('should throw BadRequestException if error occurs during deletion', async () => {
      const queryBuilderMock = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, user: { user_id: 1 } }])
      };
  
      jest.spyOn(notificationRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);
      jest.spyOn(notificationRepository, 'softRemove').mockRejectedValue(new Error('Database error'));
  
      await expect(service.deleteMultipleNotifications([1], 1)).rejects.toThrow(BadRequestException);
    });
  
    it('should throw NotFoundException if no notifications are found', async () => {
      const queryBuilderMock = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };
  
      jest.spyOn(notificationRepository, 'createQueryBuilder').mockReturnValue(queryBuilderMock as any);
  
      await expect(service.deleteMultipleNotifications([1, 2, 3], 1)).rejects.toThrow(NotFoundException);
    });
  });

  // findUserIdByLoginId 메서드 테스트
  describe('findUserIdByLoginId', () => {
    it('should return userId by loginId', async () => {
      const user: Partial<UserAccount> = {
        user_id: 1,
        login_id: 'user123',
        password: 'pass123',
        confirm_password: 'pass123',
        name: 'User One',
      };

      // UserAccount 조회 모킹
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as UserAccount);

      const result = await service.findUserIdByLoginId('user123');
      expect(result.userId).toEqual(1);
    });

    // 예외 처리 테스트
    it('should throw BadRequestException if user is not found', async () => {
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
        await expect(service.findUserIdByLoginId('user123')).rejects.toThrow(BadRequestException);
      });
    });
  });