import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Comment } from './comment.entity';

@Entity()
export class CommentLike {
  @PrimaryGeneratedColumn()
  comment_like_id: number;

  @ManyToOne(() => Comment, (comment) => comment.commentLike, {
    nullable: false,
  })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne(() => UserAccount, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;
}
