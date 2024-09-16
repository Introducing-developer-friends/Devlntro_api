import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';
import { CommentLike } from './comment-like.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  comment_id: number;

  @ManyToOne(() => Post, post => post.comments)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => UserAccount, userAccount => userAccount.comments) // 댓글 작성자와의 다대일 관계
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: 0 }) // 좋아요 수, 기본값은 0
  comment_like_count: number;

  @OneToMany(() => CommentLike, commentLike => commentLike.comment) // 댓글에 달린 좋아요와의 1:N 관계
  commentLike: CommentLike[];
}