import { Repository, SelectQueryBuilder } from 'typeorm';

import { Post } from '../post/entity/post.entity';
import { Comment } from '../comment/entity/comment.entity';
import { UserAccount } from '../user/entity/user-account.entity';

export const createMockQueryBuilder = () => {
  const queryBuilder = Object.create(SelectQueryBuilder.prototype);
  return Object.assign(queryBuilder, {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    softDelete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  });
};

export const createMockRepository = <T>(
  queryBuilder: SelectQueryBuilder<T>,
) => {
  const repository = Object.create(Repository.prototype);
  return Object.assign(repository, {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    update: jest.fn(),
    hasId: jest.fn(),
    getId: jest.fn(),
  });
};

export const createMockUser = (): UserAccount => ({
  user_id: 1,
  login_id: 'testUser123',
  password: 'hashedPassword',
  confirm_password: 'hashedPassword',
  name: 'testUser',
  currentTokenVersion: 1,
  deletedAt: null,
  profile: null,
  contacts: [],
  contactOf: [],
  posts: [],
  comments: [],
  postLikes: [],
  sentFriendRequests: [],
  receivedFriendRequests: [],
  notifications: [],
  refreshTokens: [],
});

export const createMockPost = (user: UserAccount = createMockUser()): Post => ({
  post_id: 1,
  user,
  image_url: 'https://example.com/image.jpg',
  content: 'Test post content',
  created_at: new Date(),
  deleted_at: null,
  post_like_count: 0,
  comments_count: 0,
  comments: [],
  postLikes: [],
});

export const createMockComment = (
  post: Post = createMockPost(),
  user: UserAccount = createMockUser(),
): Comment => ({
  comment_id: 1,
  post,
  userAccount: user,
  content: 'Test comment',
  created_at: new Date(),
  like_count: 5,
  commentLike: [],
  deleted_at: null,
});
