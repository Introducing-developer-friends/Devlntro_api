import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';
import { BusinessContact } from '../../contacts/entity/business-contact.entity';
import { Post } from '../../post/entity/post.entity';
import { Comment } from '../../comment/entity/comment.entity';
import { PostLike } from '../../post/entity/post-like.entity';
import { FriendRequest } from '../../contacts/entity/friend-request.entity';
import { Notification } from '../../notification/entity/notification.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';

@Entity()
export class UserAccount {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  login_id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  password: string;

  @Column()
  confirm_password: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'int',
    default: 0,
    name: 'current_token_version',
  })
  currentTokenVersion: number;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date;

  @OneToOne(
    () => BusinessProfile,
    (businessContact) => businessContact.userAccount,
    { nullable: false },
  )
  profile: BusinessProfile;

  @OneToMany(
    () => BusinessContact,
    (businessContact) => businessContact.userAccount,
  )
  contacts: BusinessContact[];

  @OneToMany(
    () => BusinessContact,
    (businessContact) => businessContact.contact_user,
  )
  contactOf: BusinessContact[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.userAccount)
  comments: Comment[];

  @OneToMany(() => PostLike, (postLike) => postLike.userAccount)
  postLikes: PostLike[];

  @OneToMany(() => FriendRequest, (request) => request.sender)
  sentFriendRequests: FriendRequest[];

  @OneToMany(() => FriendRequest, (request) => request.receiver)
  receivedFriendRequests: FriendRequest[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
