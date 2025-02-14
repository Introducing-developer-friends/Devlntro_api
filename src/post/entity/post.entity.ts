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
import { Comment } from '../../comment/entity/comment.entity';
import { PostLike } from './post-like.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  post_id: number;

  @ManyToOne(() => UserAccount, (user) => user.posts, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  image_url: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  content: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  created_at: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at?: Date;

  @Column({
    type: 'int',
    default: 0,
    nullable: true,
  })
  post_like_count: number;

  @Column({
    name: 'post_comments_count',
    type: 'int',
    default: 0,
    nullable: true,
  })
  comments_count: number;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  postLikes: PostLike[];
}
