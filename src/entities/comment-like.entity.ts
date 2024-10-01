import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Comment } from './comment.entity';

@Entity()
export class CommentLike {
  @PrimaryGeneratedColumn()
  comment_like_id: number;

  @ManyToOne(() => Comment, comment => comment.commentLike) // 댓글과의 다대일 관계
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne(() => UserAccount) // 좋아요를 누른 사용자와의 다대일 관계
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @CreateDateColumn()
  created_at: Date;
}