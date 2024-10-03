import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../entities/notification.entity';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserAccount, Post, Comment])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}