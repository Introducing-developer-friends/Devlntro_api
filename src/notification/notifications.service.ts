import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { UserAccount } from '../entities/user-account.entity'; // UserAccount 엔티티 추가
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>
  ) {}

  // 사용자의 알림 목록을 조회하는 메서드
  async getNotifications(userId: number) {
    try {
      // 사용자 ID에 해당하는 알림을 최신순으로 조회
      const notifications = await this.notificationRepository.find({
        where: { user: { user_id: userId } },
        order: { createdAt: 'DESC' }
      });

      // 조회된 알림을 클라이언트에 전송할 형식으로 변환
      return {
        statusCode: 200,
        message: '알림 목록을 성공적으로 조회했습니다.',
        notifications: notifications.map(notification => ({
          notificationId: notification.id,
          type: notification.type,
          message: notification.message,
          postId: notification.post?.post_id,
          commentId: notification.comment?.comment_id,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        }))
      };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw new BadRequestException('알림 조회 중 오류가 발생했습니다.');
    }
  }

  // 알림을 읽음 처리하는 메서드
  async markAsRead(notificationId: number, userId: number) {
    try {
      // 해당 알림을 찾아 읽음 처리
      const result = await this.notificationRepository.update(
        { id: notificationId, user: { user_id: userId } },
        { isRead: true }
      );
      if (result.affected === 0) {
        throw new NotFoundException('해당 알림을 찾을 수 없습니다.');
      }
      return {
        statusCode: 200,
        message: '알림이 성공적으로 읽음 처리되었습니다.'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('알림 읽음 처리 중 오류가 발생했습니다.');
    }
  }

  // 새로운 알림을 생성하는 메서드
  async createNotification(userId: number, type: string, message: string, postId?: number, commentId?: number) {
    try {
      // 사용자 확인
      const user = await this.userRepository.findOne({ where: { user_id: userId } });
      if (!user) {
        throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
      }

      let post = null;
      let comment = null;

      // 게시물 확인 (있는 경우)
      if (postId) {
        post = await this.postRepository.findOne({ where: { post_id: postId } });
        if (!post) {
          throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
        }
      }

      // 댓글 확인 (있는 경우)
      if (commentId) {
        comment = await this.commentRepository.findOne({ where: { comment_id: commentId } });
        if (!comment) {
          throw new NotFoundException('해당 댓글을 찾을 수 없습니다.');
        }
      }

      // 알림 생성 및 저장
      const notification = this.notificationRepository.create({
        user,
        type,
        message,
        post,
        comment
      });

      const savedNotification = await this.notificationRepository.save(notification);
      return {
        statusCode: 201,
        message: `${type} 알림이 성공적으로 생성되었습니다.`,
        notificationId: savedNotification.id
      };
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw new BadRequestException(`${type} 알림 생성 중 오류가 발생했습니다.`);
    }
  }

  // 단일 알림을 삭제하는 메서드
  async deleteNotification(notificationId: number, userId: number) {
    try {
      // 소프트 삭제 수행
      const result = await this.notificationRepository.softDelete({
        id: notificationId,
        user: { user_id: userId }
      });
      if (result.affected === 0) {
        throw new NotFoundException('해당 알림을 찾을 수 없습니다.');
      }
      return {
        statusCode: 200,
        message: '알림이 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('알림 삭제 중 오류가 발생했습니다.');
    }
  }

  // 여러 알림을 한 번에 삭제하는 메서드
  async deleteMultipleNotifications(notificationIds: number[], userId: number) {
    try {
      // 여러 알림 소프트 삭제 수행
      const result = await this.notificationRepository.softDelete({
        id: In(notificationIds),
        user: { user_id: userId }
      });
      if (result.affected === 0) {
        throw new NotFoundException('삭제할 알림을 찾을 수 없습니다.');
      }
      return {
        statusCode: 200,
        message: '알림들이 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('알림 삭제 중 오류가 발생했습니다.');
    }
  }
}
