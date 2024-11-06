import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique  } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';

@Entity()
@Unique(['post', 'userAccount'])
export class PostLike {
  @PrimaryGeneratedColumn()
  post_like_id: number;

  @ManyToOne(() => Post, post => post.postLikes)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => UserAccount, userAccount => userAccount.postLikes)
  @JoinColumn({ name: 'user_id' }) // 외래 키 user_id로 연결
  userAccount: UserAccount;

  @CreateDateColumn()
  created_at: Date;
}