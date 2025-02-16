import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from '../../user/entity/user-account.entity';
import { Post } from '../../post/entity/post.entity';
import { Comment } from '../../comment/entity/comment.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  notification_id: number;

  @ManyToOne(() => UserAccount, { nullable: false })
  @JoinColumn({ name: 'sender_id' })
  sender: UserAccount;

  @ManyToOne(() => UserAccount, { nullable: false })
  @JoinColumn({ name: 'receiver_id' })
  receiver: UserAccount;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  type: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  message: string;

  @Column({
    name: `is_read`,
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isRead: boolean;

  @CreateDateColumn({
    name: `created_at`,
    type: 'timestamp',
  })
  createdAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;
  user: any;
}
