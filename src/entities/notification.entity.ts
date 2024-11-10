import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn, JoinColumn, Index } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

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
  post: Post; // 관련 게시물 (있는 경우)

@ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({
    type: 'varchar', 
    length: 50, 
    nullable: false 
})
  type: string;

  @Column({
    type: 'varchar', 
    length: 255, 
    nullable: false 
})
  message: string;

  @Column({
    name: `is_read`,
    type: 'boolean',
    default: false,
    nullable: false
})
isRead: boolean; // 알림 읽음 여부

  @CreateDateColumn({
    name: `created_at`,
    type: 'timestamp'
})
createdAt: Date; // 알림 생성 시간

@DeleteDateColumn({
  name: 'deleted_at',
  type: 'timestamp',
  nullable: true
})
deletedAt: Date; // 소프트 삭제를 위한 삭제 시간 (null이면 삭제되지 않은 상태)
  user: any;
}