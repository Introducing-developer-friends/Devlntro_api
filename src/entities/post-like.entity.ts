import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';

@Entity()
export class PostLike {
  @PrimaryGeneratedColumn()
  post_like_id: number;

  @ManyToOne(() => Post, (post) => post.postLikes, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => UserAccount, (userAccount) => userAccount.postLikes, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;
}
