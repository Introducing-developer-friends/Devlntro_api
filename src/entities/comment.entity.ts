import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, DeleteDateColumn, Index  } from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Post } from './post.entity';
import { CommentLike } from './comment-like.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  comment_id: number;

  @ManyToOne(() => Post, post => post.comments, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => UserAccount, userAccount => userAccount.comments, { nullable: false }) // 댓글 작성자와의 다대일 관계
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @Column({
    type: 'text', 
    nullable: false 
})
  content: string;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 6
})
  created_at: Date;

  @Column({
    type: 'int', 
    default: 0, 
    nullable: true 
}) // 좋아요 수, 기본값은 0
  like_count: number;

  @OneToMany(() => CommentLike, commentLike => commentLike.comment) // 댓글에 달린 좋아요와의 1:N 관계
  commentLike: CommentLike[];

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true 
})
  deleted_at: Date;
}