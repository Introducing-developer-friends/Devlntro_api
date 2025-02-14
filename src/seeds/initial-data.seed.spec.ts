import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service';
import { UserAccount } from '../user/entity/user-account.entity';
import { Post } from '../post/entity/post.entity';
import { Comment } from '../comment/entity/comment.entity';
import { PostLike } from '../post/entity/post-like.entity';
import { CommentLike } from '../comment/entity/comment-like.entity';
import { BusinessContact } from '../contacts/entity/business-contact.entity';
import { BusinessProfile } from '../user/entity/business-profile.entity';
import { Notification } from '../notification/entity/notification.entity';
import { FriendRequest } from '../contacts/entity/friend-request.entity';
import { seedInitialData } from './initial-data.seed';

jest.mock('@nestjs/config');
jest.mock('../s3/s3.service');
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
}));

describe('SeedInitialData', () => {
  let mockedDataSource: jest.Mocked<DataSource>;
  let mockedUserRepo: jest.Mocked<Repository<UserAccount>>;
  let mockedPostRepo: jest.Mocked<Repository<Post>>;
  let mockedCommentRepo: jest.Mocked<Repository<Comment>>;
  let mockedPostLikeRepo: jest.Mocked<Repository<PostLike>>;
  let mockedCommentLikeRepo: jest.Mocked<Repository<CommentLike>>;
  let mockedBusinessContactRepo: jest.Mocked<Repository<BusinessContact>>;
  let mockedBusinessProfileRepo: jest.Mocked<Repository<BusinessProfile>>;
  let mockedNotificationRepo: jest.Mocked<Repository<Notification>>;
  let mockedFriendRequestRepo: jest.Mocked<Repository<FriendRequest>>;

  beforeEach(async () => {
    mockedUserRepo = getMockRepository<UserAccount>();
    mockedPostRepo = getMockRepository<Post>();
    mockedCommentRepo = getMockRepository<Comment>();
    mockedPostLikeRepo = getMockRepository<PostLike>();
    mockedCommentLikeRepo = getMockRepository<CommentLike>();
    mockedBusinessContactRepo = getMockRepository<BusinessContact>();
    mockedBusinessProfileRepo = getMockRepository<BusinessProfile>();
    mockedNotificationRepo = getMockRepository<Notification>();
    mockedFriendRequestRepo = getMockRepository<FriendRequest>();

    mockedDataSource = {
      getRepository: jest.fn().mockImplementation((entity: any) => {
        switch (entity) {
          case UserAccount:
            return mockedUserRepo;
          case Post:
            return mockedPostRepo;
          case Comment:
            return mockedCommentRepo;
          case PostLike:
            return mockedPostLikeRepo;
          case CommentLike:
            return mockedCommentLikeRepo;
          case BusinessContact:
            return mockedBusinessContactRepo;
          case BusinessProfile:
            return mockedBusinessProfileRepo;
          case Notification:
            return mockedNotificationRepo;
          case FriendRequest:
            return mockedFriendRequestRepo;
          default:
            return getMockRepository();
        }
      }),
    } as unknown as jest.Mocked<DataSource>;

    const mockS3Service = {
      uploadFile: jest
        .fn()
        .mockResolvedValue('https://mocked-url.com/image.jpg'),
      cloudFrontDomain: 'test-domain.cloudfront.net',
      s3Client: {},
      configService: {},
      onModuleInit: jest.fn(),
      initializeS3Client: jest.fn(),
      uploadFileBuffer: jest.fn(),
      deleteFile: jest.fn(),
      getSignedUrl: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('mocked-value'),
    };

    jest.mocked(S3Service).mockImplementation(() => mockS3Service as any);
    jest
      .mocked(ConfigService)
      .mockImplementation(() => mockConfigService as any);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response),
    );

    const mockUsers = [createMockUser(1), createMockUser(2), createMockUser(3)];

    let userSaveCount = 0;
    mockedUserRepo.save.mockImplementation(() => {
      return Promise.resolve(mockUsers[userSaveCount++]);
    });

    mockedCommentRepo.create.mockImplementation(
      (comment: Partial<Comment>) =>
        ({
          ...comment,
          comment_id: 1,
          like_count: 0,
        }) as Comment,
    );
    mockedCommentRepo.save.mockImplementation((comment: Comment) =>
      Promise.resolve({
        ...comment,
        comment_id: comment.comment_id || 1,
        like_count: comment.like_count ?? 0,
      } as Comment),
    );

    mockedPostLikeRepo.create.mockImplementation(
      (postLike: Partial<PostLike>) => postLike as PostLike,
    );
    mockedPostLikeRepo.save.mockImplementation((postLike: PostLike) =>
      Promise.resolve({
        ...postLike,
        id: 1,
      }),
    );

    mockedCommentLikeRepo.create.mockImplementation(
      (commentLike: Partial<CommentLike>) =>
        ({
          ...commentLike,
          comment_like_id: 1,
          created_at: new Date(),
        }) as CommentLike,
    );
    mockedCommentLikeRepo.save.mockImplementation((commentLike: CommentLike) =>
      Promise.resolve({
        ...commentLike,
        comment_like_id: 1,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create users with business profiles', async () => {
    await seedInitialData(mockedDataSource);

    expect(mockedUserRepo.create).toHaveBeenCalledTimes(3);
    expect(mockedUserRepo.save).toHaveBeenCalledTimes(3);
    expect(mockedBusinessProfileRepo.create).toHaveBeenCalledTimes(3);
    expect(mockedBusinessProfileRepo.save).toHaveBeenCalledTimes(3);
  });

  it('should create business contacts between users', async () => {
    await seedInitialData(mockedDataSource);

    expect(mockedBusinessContactRepo.create).toHaveBeenCalledTimes(2);
    expect(mockedBusinessContactRepo.save).toHaveBeenCalledTimes(2);
  });

  it('should create friend request and notification', async () => {
    await seedInitialData(mockedDataSource);

    expect(mockedFriendRequestRepo.create).toHaveBeenCalledTimes(1);
    expect(mockedFriendRequestRepo.save).toHaveBeenCalledTimes(1);
    expect(mockedNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'friend_request',
      }),
    );
  });

  it('should create posts with images', async () => {
    await seedInitialData(mockedDataSource);

    const uploadFileMock =
      jest.mocked(S3Service).mock.results[0].value.uploadFile;
    expect(uploadFileMock).toHaveBeenCalledTimes(3);
    expect(mockedPostRepo.create).toHaveBeenCalledTimes(3);
    expect(mockedPostRepo.save).toHaveBeenCalledTimes(6);
  });

  it("should create interactions on the last user's post", async () => {
    mockedCommentRepo.create.mockClear();
    mockedPostLikeRepo.create.mockClear();
    mockedCommentLikeRepo.create.mockClear();

    const mockUsers: UserAccount[] = [
      createMockUser(1),
      createMockUser(2),
      createMockUser(3),
    ];

    const mockPost: Post = {
      post_id: 1,
      user: mockUsers[2],
      image_url: 'mock-image-url',
      content: 'Mock post content',
      created_at: new Date('2024-01-01'),
      post_like_count: 0,
      comments_count: 0,
    } as Post;

    const mockComment: Comment = {
      comment_id: 1,
      post: mockPost,
      userAccount: mockUsers[1],
      content: 'Mock comment content',
      created_at: new Date('2024-01-01'),
      like_count: 0,
      commentLike: [],
      deleted_at: null,
    };

    mockedCommentRepo.create.mockImplementation(() => ({
      ...mockComment,
      comment_id: 1,
      like_count: 0,
    }));

    mockedPostLikeRepo.create.mockImplementation(() => ({
      post_like_id: 1,
      post: mockPost,
      userAccount: mockUsers[1],
      created_at: new Date('2024-01-01'),
    }));

    mockedCommentLikeRepo.create.mockImplementation(() => ({
      comment_like_id: 1,
      comment: mockComment,
      user: mockUsers[1],
      created_at: new Date('2024-01-01'),
    }));

    await seedInitialData(mockedDataSource);

    expect(mockedCommentRepo.create).toHaveBeenCalledTimes(mockUsers.length);

    expect(mockedPostLikeRepo.create).toHaveBeenCalledTimes(3);
    expect(mockedCommentLikeRepo.create).toHaveBeenCalledTimes(3);
  });

  it('should handle S3 upload failure', async () => {
    jest.mocked(S3Service).mockImplementation(
      () =>
        ({
          uploadFile: jest.fn().mockRejectedValueOnce(new Error('S3 Error')),
          cloudFrontDomain: 'test-domain.cloudfront.net',
        }) as unknown as S3Service,
    );

    await expect(seedInitialData(mockedDataSource)).rejects.toThrow('S3 Error');
  });
});

function getMockRepository<T = any>(): jest.Mocked<Repository<T>> {
  return {
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    metadata: {},
    target: {},
    manager: {},
    createQueryBuilder: jest.fn(),
    hasId: jest.fn(),
    getId: jest.fn(),
    merge: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    insert: jest.fn(),
    upsert: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    findByIds: jest.fn(),
    findAndCountBy: jest.fn(),
    findOneBy: jest.fn(),
    findOneById: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    query: jest.fn(),
    clear: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    extend: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

function createMockUser(id: number): UserAccount {
  return {
    user_id: id,
    login_id: `user${id}`,
    password: 'hashedPassword',
    confirm_password: 'hashedPassword',
    name: `User ${id}`,
    currentTokenVersion: 1,
  } as UserAccount;
}
