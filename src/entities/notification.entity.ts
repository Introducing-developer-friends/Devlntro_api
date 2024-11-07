import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn, JoinColumn, Index } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserAccount, user => user.notifications, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column({ 
    nullable: false
  })
  senderId: number;

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
    default: false,
    nullable: false
})
isRead: boolean; // 알림 읽음 여부

  @CreateDateColumn({
    type: 'timestamp'
})
createdAt: Date; // 알림 생성 시간

@DeleteDateColumn({
  type: 'timestamp',
  nullable: true
})
deletedAt: Date; // 소프트 삭제를 위한 삭제 시간 (null이면 삭제되지 않은 상태)

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Post; // 관련 게시물 (있는 경우)

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'commentId' })
  comment: Comment; // 관련 댓글 (있는 경우)
}