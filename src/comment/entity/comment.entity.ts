import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserAccount } from '../../user/entity/user-account.entity';
import { Post } from '../../post/entity/post.entity';
import { CommentLike } from './comment-like.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  comment_id: number;

  @ManyToOne(() => Post, (post) => post.comments, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => UserAccount, (userAccount) => userAccount.comments, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @Column({
    type: 'text',
    nullable: false,
  })
  content: string;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 6,
  })
  created_at: Date;

  @Column({
    name: 'comment_like_count',
    type: 'int',
    default: 0,
    nullable: true,
  })
  like_count: number;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  commentLike: CommentLike[];

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date;
}
