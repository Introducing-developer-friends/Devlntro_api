import { DataSource } from 'typeorm';
import { UserAccount } from '../user/entity/user-account.entity';
import { Post } from '../post/entity/post.entity';
import { Comment } from '../comment/entity/comment.entity';
import { PostLike } from '../post/entity/post-like.entity';
import { CommentLike } from '../comment/entity/comment-like.entity';
import { BusinessContact } from '../contacts/entity/business-contact.entity';
import { BusinessProfile } from '../user/entity/business-profile.entity';
import { Notification } from '../notification/entity/notification.entity';
import { FriendRequest } from '../contacts/entity/friend-request.entity';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { S3Service } from '../s3/service/s3.service';
import { ConfigService } from '@nestjs/config';

export const seedInitialData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UserAccount);
  const postRepository = dataSource.getRepository(Post);
  const commentRepository = dataSource.getRepository(Comment);
  const postLikeRepository = dataSource.getRepository(PostLike);
  const commentLikeRepository = dataSource.getRepository(CommentLike);
  const businessContactRepository = dataSource.getRepository(BusinessContact);
  const businessProfileRepository = dataSource.getRepository(BusinessProfile);
  const notificationRepository = dataSource.getRepository(Notification);
  const friendRequestRepository = dataSource.getRepository(FriendRequest);

  const configService = new ConfigService();
  const s3Service = new S3Service(configService);

  const hashedPassword = await bcrypt.hash('password123', 10);

  const createNotification = async (
    receiver: UserAccount,
    sender: UserAccount,
    type: string,
    message: string,
    post?: Post,
    comment?: Comment,
  ) => {
    const notification = notificationRepository.create({
      receiver,
      sender,
      type,
      message,
      post,
      comment,
    });
    await notificationRepository.save(notification);
    console.log(
      `${type} notification created: from ${sender.login_id} to ${receiver.login_id}`,
    );
  };

  const uploadImageToS3 = async () => {
    const response = await fetch('https://picsum.photos/640/480');
    const buffer = await response.arrayBuffer();
    const file = {
      buffer: Buffer.from(buffer),
      originalname: `image-${Date.now()}.jpg`,
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const sanitizedFileName = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^\w.-]/g, '');
    const key = `images/${Date.now()}-${sanitizedFileName}`;

    try {
      const imageUrl = await s3Service.uploadFile(file, key);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw error;
    }
  };

  const users: UserAccount[] = [];
  for (let i = 0; i < 3; i++) {
    const user = userRepository.create({
      login_id: faker.internet.userName(),
      password: hashedPassword,
      confirm_password: hashedPassword,
      name: faker.person.fullName(),
    });
    await userRepository.save(user);

    const profile = businessProfileRepository.create({
      userAccount: user,
      company: faker.company.name(),
      department: faker.commerce.department(),
      position: faker.person.jobTitle(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    });
    await businessProfileRepository.save(profile);

    users.push(user);
    console.log(`User ${user.login_id} created`);
  }

  const businessContactAB = businessContactRepository.create({
    userAccount: users[0],
    contact_user: users[1],
  });
  await businessContactRepository.save(businessContactAB);
  console.log(
    `Business contact created: ${users[0].name} <-> ${users[1].name}`,
  );

  const businessContactBC = businessContactRepository.create({
    userAccount: users[1],
    contact_user: users[2],
  });
  await businessContactRepository.save(businessContactBC);
  console.log(
    `Business contact created: ${users[1].name} <-> ${users[2].name}`,
  );

  const friendRequest = friendRequestRepository.create({
    sender: users[0],
    receiver: users[2],
    status: 'pending',
    created_at: faker.date.past(),
  });
  await friendRequestRepository.save(friendRequest);
  console.log(
    `Friend request sent from ${users[0].login_id} to ${users[2].login_id}`,
  );

  await createNotification(
    users[2],
    users[0],
    'friend_request',
    `${users[0].name}님이 친구 요청을 보냈습니다.`,
  );

  for (const user of users) {
    const imageUrl = await uploadImageToS3();

    const post = postRepository.create({
      user,
      image_url: imageUrl,
      content: faker.lorem.sentence(),
      created_at: faker.date.past(),
      post_like_count: 0,
      comments_count: 0,
    });
    await postRepository.save(post);
    console.log(
      `Post for user ${user.login_id} created with image: ${imageUrl}`,
    );

    if (user.user_id === users[2].user_id) {
      const bUser = users[1];

      const comment = commentRepository.create({
        post,
        userAccount: bUser,
        content: faker.lorem.sentence(),
        created_at: faker.date.past(),
        like_count: 0,
      });
      await commentRepository.save(comment);
      post.comments_count += 1;
      console.log(`Comment added by ${bUser.login_id} to post ${post.post_id}`);

      await createNotification(
        user,
        bUser,
        'comment',
        `${bUser.name}님이 당신의 게시물에 댓글을 남겼습니다.`,
        post,
        comment,
      );

      const postLike = postLikeRepository.create({
        post,
        userAccount: bUser,
        created_at: faker.date.past(),
      });
      await postLikeRepository.save(postLike);
      post.post_like_count += 1;
      console.log(`Like added by ${bUser.login_id} to post ${post.post_id}`);

      await createNotification(
        user,
        bUser,
        'like_post',
        `${bUser.name}님이 당신의 게시물에 좋아요를 눌렀습니다.`,
        post,
      );

      const commentLike = commentLikeRepository.create({
        comment: comment,
        user: bUser,
      });
      await commentLikeRepository.save(commentLike);
      comment.like_count += 1;
      await commentRepository.save(comment);
      console.log(
        `Comment like added by ${bUser.login_id} to comment ${comment.comment_id}`,
      );

      await createNotification(
        user,
        bUser,
        'like_comment',
        `${bUser.name}님이 당신의 댓글에 좋아요를 눌렀습니다.`,
        post,
        comment,
      );
    }

    await postRepository.save(post);
  }

  console.log('All seed data inserted successfully');
};
