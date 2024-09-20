import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, DeleteDateColumn  } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  post_id: number;

  @ManyToOne(() => UserAccount, user => user.posts) // 작성자와의 다대일 관계
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column()
  image_url: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @DeleteDateColumn() 
  deleted_at?: Date;

  @Column({ default: 0 })
  post_like_count: number;

  @Column({ default: 0 })
  comments_count: number;

  @OneToMany(() => Comment, comment => comment.post) // 댓글과의 1:N 관계
  comments: Comment[];

  @OneToMany(() => PostLike, postLike => postLike.post) // 좋아요와의 1:N 관계
  postLikes: PostLike[];
}