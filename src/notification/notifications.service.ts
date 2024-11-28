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
        .leftJoin('notification.sender', 'sender')
        // post와 comment는 조건부로 조인
        .leftJoin('notification.post', 'post', 'notification.type IN (:...postTypes)', {
          postTypes: ['POST_LIKE', 'POST_COMMENT']
        })
        .leftJoin('notification.comment', 'comment', 'notification.type IN (:...commentTypes)', {
          commentTypes: ['COMMENT_LIKE', 'COMMENT_REPLY']
        })
        .where('notification.receiver_id = :userId', { userId })
        .orderBy('notification.createdAt', 'DESC')
        .select([
          'notification.notification_id',
          'notification.type',
          'notification.message',
          'notification.isRead',
          'notification.createdAt',
          'sender.user_id',
          'post.post_id',
          'comment.comment_id'
        ])
        .getMany();


      return notifications.map(({
        notification_id,
        type,
        message,
        isRead,
        createdAt,
        sender,
        post,
        comment
      }) => ({
        notificationId: notification_id,
        type: type as NotificationType,
        message,
        postId: post?.post_id,
        commentId: comment?.comment_id,
        isRead,
        createdAt,
        senderId: sender.user_id
      }));
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error.message}`);
      throw new BadRequestException('알림 조회 중 오류가 발생했습니다.');
    }
  }

  // 알림을 읽음 처리하는 메서드
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const result = await this.notificationRepository
    .createQueryBuilder()
    .update(Notification)
    .set({ isRead: true })
    .where('notification_id = :notificationId', { notificationId })
    .andWhere('receiver_id = :userId', { userId })
    .execute();

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
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.user_id IN (:...userIds)', { 
        userIds: [data.receiverId, data.senderId] 
      })
      .select(['user.user_id'])
      .getMany();

    const receiver = users.find(u => u.user_id === data.receiverId);
    const sender = users.find(u => u.user_id === data.senderId);

    if (!receiver || !sender) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // post와 comment 순차적 처리
      let post = null;
      let comment = null;

      if (data.postId) {
        post = await this.postRepository.findOne({
          where: { post_id: data.postId },
          select: ['post_id']
        });
        if (!post) {
          throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
        }
      }

      if (data.commentId) {
        comment = await this.commentRepository.findOne({
          where: { comment_id: data.commentId },
          select: ['comment_id']
        });
        if (!comment) {
          throw new NotFoundException('해당 댓글을 찾을 수 없습니다.');
        }
      }

    // 알림 생성 및 저장
    const notification = this.notificationRepository.create({
      receiver,
      sender,
      type: data.type,
      message: data.message,
      post,
      comment
    });

    const savedNotification = await this.notificationRepository.save(notification);
    return { notificationId: savedNotification.notification_id };

  }

  // 단일 알림을 삭제하는 메서드
  async deleteNotification(notificationId: number, userId: number): Promise<void> {

    // 소프트 삭제 수행
    const result = await this.notificationRepository.softDelete({
      notification_id: notificationId,
      receiver: { user_id: userId }
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
      .innerJoin('notification.receiver', 'receiver')
      .where('notification.notification_id IN (:...ids)', { ids: notificationIds })
      .andWhere('receiver.user_id = :userId', { userId })
      .select(['notification.notification_id'])
      .getMany();

    if (notifications.length === 0) {
      throw new NotFoundException('삭제할 알림을 찾을 수 없습니다.');
    }

    // 실제 존재하는 알림 ID만 추출
  const validNotificationIds = notifications.map(n => n.notification_id);

  // softDelete를 한 번의 쿼리로 실행
  const result = await this.notificationRepository
    .createQueryBuilder()
    .softDelete()
    .where('notification_id IN (:...ids)', { ids: validNotificationIds })
    .andWhere('receiver_id = :userId', { userId })
    .execute();

  return result.affected || 0;
  }

  // 로그인 ID로 사용자 ID를 조회하는 로직
  async findUserIdByLoginId(loginId: string): Promise<number> {

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.login_id = :loginId', { loginId })
      .select('user.user_id')  // user_id만 필요하므로 select로 지정
      .getOne();

    if (!user) {
      throw new NotFoundException('해당 로그인 ID에 해당하는 사용자를 찾을 수 없습니다.');
    }

    return user.user_id;
  }
}
