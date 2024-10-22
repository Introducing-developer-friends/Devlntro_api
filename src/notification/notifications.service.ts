import { Injectable, NotFoundException, BadRequestException, Logger  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { UserAccount } from '../entities/user-account.entity'; // UserAccount 엔티티 추가
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import {
  NotificationType,
  NotificationInfo,
  NotificationCreateData,
  UserIdResponse
} from '../types/notification.types';
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly  notificationRepository: Repository<Notification>,
    @InjectRepository(UserAccount)
    private readonly  userRepository: Repository<UserAccount>,
    @InjectRepository(Post)
    private readonly  postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly  commentRepository: Repository<Comment>
  ) {}

  // 사용자의 알림 목록을 조회하는 메서드
  async getNotifications(userId: number): Promise<NotificationInfo[]> {
    try {
      // 사용자 ID에 해당하는 알림을 최신순으로 조회
      const notifications = await this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .leftJoinAndSelect('notification.post', 'post')
      .leftJoinAndSelect('notification.comment', 'comment')
      .where('notification.user.user_id = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .select([
        'notification',
        'user.user_id',
        'post.post_id',
        'comment.comment_id'
      ])
      .getMany();

      // 조회된 알림을 클라이언트에 전송할 형식으로 변환
      return notifications.map(notification => ({
        notificationId: notification.id,
        type: notification.type as NotificationType,
        message: notification.message,
        postId: notification.post?.post_id,
        commentId: notification.comment?.comment_id,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        senderId: notification.senderId
      }));
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error.message}`);
      throw new BadRequestException('알림 조회 중 오류가 발생했습니다.');
    }
  }

  // 알림을 읽음 처리하는 메서드
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const result = await this.notificationRepository.update(
      { id: notificationId, user: { user_id: userId } },
      { isRead: true }
    );

    if (result.affected === 0) {
      throw new NotFoundException('해당 알림을 찾을 수 없습니다.');
    }
  }

  // 새로운 알림을 생성하는 메서드
  async createNotification(data: NotificationCreateData): Promise<{ notificationId: number }> {
    
    if (data.senderId === data.receiverId) {
      throw new BadRequestException('본인의 활동에 대한 알림은 생성되지 않습니다.');
    }

      // 알림을 받을 사용자 확인
      const receiver = await this.userRepository.findOne({ 
        where: { user_id: data.receiverId } 
      });
      if (!receiver) {
        throw new NotFoundException('알림을 받을 사용자를 찾을 수 없습니다.');
      }

      let post = null;
      let comment = null;

      if (data.postId) {
        post = await this.postRepository.findOne({ 
          where: { post_id: data.postId },
          relations: ['user']
        });
        if (!post) {
          throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
        }
      }

      if (data.commentId) {
        comment = await this.commentRepository.findOne({
          where: { comment_id: data.commentId },
          relations: ['userAccount']
        });
        if (!comment) {
          throw new NotFoundException('해당 댓글을 찾을 수 없습니다.');
        }
      }

      // 알림 생성 및 저장
      const notification = this.notificationRepository.create({
        user: receiver,
        senderId: data.senderId,
        type: data.type,
        message: data.message,
        post,
        comment
      });

      const savedNotification = await this.notificationRepository.save(notification);
      return { notificationId: savedNotification.id };

  }

  // 단일 알림을 삭제하는 메서드
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    
      // 소프트 삭제 수행
      const result = await this.notificationRepository.softDelete({
        id: notificationId,
        user: { user_id: userId }
      });

      if (result.affected === 0) {
        throw new NotFoundException('해당 알림을 찾을 수 없습니다.');
      }
      
    
  }

  // 여러 알림을 한 번에 삭제하는 메서드
  async deleteMultipleNotifications(notificationIds: number[], userId: number): Promise<number> {
    
      // 먼저 삭제할 알림들을 조회
      const notifications  = await this.notificationRepository
      .createQueryBuilder('notification')
      .innerJoin('notification.user', 'user')
      .where('notification.id IN (:...ids)', { ids: notificationIds })
      .andWhere('user.user_id = :userId', { userId })
      .getMany();
  
      if (notifications.length === 0) {
        throw new NotFoundException('삭제할 알림을 찾을 수 없습니다.');
      }

      // 조회된 알림들을 소프트 삭제
      const result = await this.notificationRepository.softRemove(notifications);
      return result.length;
    
  }

  // 로그인 ID로 사용자 ID를 조회하는 로직
  async findUserIdByLoginId(loginId: string): Promise<number> {
    
    const user = await this.userRepository.findOne({ 
      where: { login_id: loginId } 
    });

      if (!user) {
        throw new NotFoundException('해당 로그인 ID에 해당하는 사용자를 찾을 수 없습니다.');
      }
      
    return user.user_id;
    }
}
