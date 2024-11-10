import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, DeleteDateColumn} from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';

// Post 엔티티는 사용자가 작성한 게시물을 나타냅니다.
@Entity()
export class Post {
  // post_id는 기본 키로 자동 생성.
  @PrimaryGeneratedColumn()
  post_id: number;

  @ManyToOne(() => UserAccount, user => user.posts, { nullable: false } ) // 작성자와의 다대일 관계
  @JoinColumn({ name: 'user_id' }) // 외래 키 컬럼을 user_id로 지정
  user: UserAccount;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: false 
})
  image_url: string;

  // 게시물의 본문 내용을 텍스트로 저장
  @Column({ 
    type: 'text', 
    nullable: false 
})
  content: string;

  // 게시물이 생성된 날짜 및 시간을 자동으로 저장
  @CreateDateColumn({ 
    type: 'timestamp'
})
  created_at: Date;

  @DeleteDateColumn({ 
    type: 'timestamp',
    nullable: true 
})
  deleted_at?: Date;

   // 게시물이 받은 좋아요 수를 저장
   @Column({ 
    type: 'int', 
    default: 0, 
    nullable: true 
})
  post_like_count: number;

  // 게시물에 달린 댓글 수를 저장
  @Column({
    name: 'post_comments_count', 
    type: 'int', 
    default: 0, 
    nullable: true 
})
  comments_count: number;

  // 게시물에 달린 여러 댓글과의 1:N 관계
  @OneToMany(() => Comment, comment => comment.post) // 댓글과의 1:N 관계
  comments: Comment[];

  // 게시물에 대한 여러 좋아요와의 1:N 관계
  @OneToMany(() => PostLike, postLike => postLike.post) // 좋아요와의 1:N 관계
  postLikes: PostLike[];
}