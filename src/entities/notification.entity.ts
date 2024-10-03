import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn, JoinColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserAccount, user => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column()
  type: string;

  @Column()
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean; // 알림 읽음 여부

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // 알림 생성 시간

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date; // 소프트 삭제를 위한 삭제 시간 (null이면 삭제되지 않은 상태)

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Post; // 관련 게시물 (있는 경우)

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'commentId' })
  comment: Comment; // 관련 댓글 (있는 경우)
}