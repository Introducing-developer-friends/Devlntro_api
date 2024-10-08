import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, DeleteDateColumn, Index  } from 'typeorm';
import { BusinessProfile } from './business-profile.entity';
import { BusinessContact } from './business-contact.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { FriendRequest } from './friend-request.entity';
import { Notification } from './notification.entity';

// UserAccount 엔티티는 사용자의 계정 정보
@Entity()
@Index("idx_login_id", ["login_id"])
export class UserAccount {
  // user_id는 기본 키로 자동 생성
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true }) // 로그인 ID, 중복 불가
  @Index()
  login_id: string;

  // 사용자의 비밀번호를 저장
  @Column()
  password: string;

  @Column()
  confirm_password: string;

  @Column()
  name: string;

  // 계정이 삭제된 날짜를 기록합니다. 소프트 삭제를 위해 사용
  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne(() => BusinessProfile, businessContact => businessContact.userAccount) // 비즈니스 프로필과의 1:1 관계
  profile: BusinessProfile;

  @OneToMany(() => BusinessContact, businessContact => businessContact.userAccount) // 이 사용자가 소유한 연락처들과의 1:N 관계
  contacts: BusinessContact[];

  @OneToMany(() => BusinessContact, businessContact => businessContact.contact_user) // 다른 사용자의 연락처에 등록된 경우와의 1:N 관계
  contactOf: BusinessContact[];

  // 이 사용자가 작성한 게시물들과의 1:N 관계
  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  // 이 사용자가 작성한 댓글들과의 1:N 관계
  @OneToMany(() => Comment, comment => comment.userAccount)
  comments: Comment[];

  // 이 사용자가 좋아요를 누른 게시물들과의 1:N 관계
  @OneToMany(() => PostLike, postLike => postLike.userAccount)
  postLikes: PostLike[];


  // 이 사용자가 보낸 친구 요청들과의 1:N 관계
  @OneToMany(() => FriendRequest, request => request.sender)
  sentFriendRequests: FriendRequest[];

  // 이 사용자가 받은 친구 요청들과의 1:N 관계
  @OneToMany(() => FriendRequest, request => request.receiver)
  receivedFriendRequests: FriendRequest[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];
}