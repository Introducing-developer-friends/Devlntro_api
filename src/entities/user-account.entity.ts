import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { BusinessProfile } from './business-profile.entity';
import { BusinessContact } from './business-contact.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';

@Entity()
export class UserAccount {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true }) // 로그인 ID, 중복 불가
  login_id: string;

  @Column()
  password: string;

  @Column()
  confirm_password: string;

  @Column()
  name: string;

  @OneToOne(() => BusinessProfile, businessContact => businessContact.userAccount) // 비즈니스 프로필과의 1:1 관계
  profile: BusinessProfile;

  @OneToMany(() => BusinessContact, businessContact => businessContact.userAccount) // 이 사용자가 소유한 연락처들과의 1:N 관계
  contacts: BusinessContact[];

  @OneToMany(() => BusinessContact, businessContact => businessContact.contact_user) // 다른 사용자의 연락처에 등록된 경우와의 1:N 관계
  contactOf: BusinessContact[];

  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  @OneToMany(() => Comment, comment => comment.userAccount)
  comments: Comment[];

  @OneToMany(() => PostLike, postLike => postLike.userAccount)
  postLikes: PostLike[];
}