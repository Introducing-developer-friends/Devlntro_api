import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entity/notification.entity';
import { UserAccount } from '../../user/entity/user-account.entity';
import { Post } from '../../post/entity/post.entity';
import { Comment } from '../../comment/entity/comment.entity';
import {
  NotificationType,
  NotificationInfo,
  NotificationCreateData,
} from '../../types/notification.types';
import { ErrorMessageType } from '../../enums/error.message.enum';
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getNotifications(userId: number): Promise<NotificationInfo[]> {
    try {
      const notifications = await this.notificationRepository
        .createQueryBuilder('notification')
        .leftJoin('notification.sender', 'sender')

        .leftJoin(
          'notification.post',
          'post',
          'notification.type IN (:...postTypes)',
          {
            postTypes: ['POST_LIKE', 'POST_COMMENT'],
          },
        )
        .leftJoin(
          'notification.comment',
          'comment',
          'notification.type IN (:...commentTypes)',
          {
            commentTypes: ['COMMENT_LIKE', 'COMMENT_REPLY'],
          },
        )
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
          'comment.comment_id',
        ])
        .getMany();

      return notifications.map(
        ({
          notification_id,
          type,
          message,
          isRead,
          createdAt,
          sender,
          post,
          comment,
        }) => ({
          notificationId: notification_id,
          type: type as NotificationType,
          message,
          postId: post?.post_id,
          commentId: comment?.comment_id,
          isRead,
          createdAt,
          senderId: sender.user_id,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error.message}`);
      throw new BadRequestException(ErrorMessageType.BAD_REQUEST);
    }
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('notification_id = :notificationId', { notificationId })
      .andWhere('receiver_id = :userId', { userId })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_NOTIFICATION);
    }
  }

  async createNotification(
    data: NotificationCreateData,
  ): Promise<{ notificationId: number }> {
    if (data.senderId === data.receiverId) {
      throw new BadRequestException(
        '본인의 활동에 대한 알림은 생성되지 않습니다.',
      );
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.user_id IN (:...userIds)', {
        userIds: [data.receiverId, data.senderId],
      })
      .select(['user.user_id'])
      .getMany();

    const receiver = users.find((u) => u.user_id === data.receiverId);
    const sender = users.find((u) => u.user_id === data.senderId);

    if (!receiver || !sender) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_USER);
    }

    let post = null;
    let comment = null;

    if (data.postId) {
      post = await this.postRepository.findOne({
        where: { post_id: data.postId },
        select: ['post_id'],
      });
      if (!post) {
        throw new NotFoundException(ErrorMessageType.NOT_FOUND_POST);
      }
    }

    if (data.commentId) {
      comment = await this.commentRepository.findOne({
        where: { comment_id: data.commentId },
        select: ['comment_id'],
      });
      if (!comment) {
        throw new NotFoundException(ErrorMessageType.NOT_FOUND_COMMENT);
      }
    }

    const notification = this.notificationRepository.create({
      receiver,
      sender,
      type: data.type,
      message: data.message,
      post,
      comment,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);
    return { notificationId: savedNotification.notification_id };
  }

  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    const result = await this.notificationRepository.softDelete({
      notification_id: notificationId,
      receiver: { user_id: userId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_NOTIFICATION);
    }
  }

  async deleteMultipleNotifications(
    notificationIds: number[],
    userId: number,
  ): Promise<number> {
    const notifications = await this.notificationRepository
      .createQueryBuilder('notification')
      .innerJoin('notification.receiver', 'receiver')
      .where('notification.notification_id IN (:...ids)', {
        ids: notificationIds,
      })
      .andWhere('receiver.user_id = :userId', { userId })
      .select(['notification.notification_id'])
      .getMany();

    if (notifications.length === 0) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_NOTIFICATION);
    }

    const validNotificationIds = notifications.map((n) => n.notification_id);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .softDelete()
      .where('notification_id IN (:...ids)', { ids: validNotificationIds })
      .andWhere('receiver_id = :userId', { userId })
      .execute();

    return result.affected || 0;
  }

  async findUserIdByLoginId(loginId: string): Promise<number> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.login_id = :loginId', { loginId })
      .select('user.user_id')
      .getOne();

    if (!user) {
      throw new NotFoundException(ErrorMessageType.NOT_FOUND_USER);
    }

    return user.user_id;
  }
}
