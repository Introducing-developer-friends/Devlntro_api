import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique  } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';

@Entity()
export class PostLike {
  @PrimaryGeneratedColumn()
  post_like_id: number;

  @ManyToOne(() => Post, post => post.postLikes, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => UserAccount, userAccount => userAccount.postLikes, { nullable: false } )
  @JoinColumn({ name: 'user_id' }) // 외래 키 user_id로 연결
  userAccount: UserAccount;

  @CreateDateColumn({ 
    type: 'timestamp'
})
  created_at: Date;
}