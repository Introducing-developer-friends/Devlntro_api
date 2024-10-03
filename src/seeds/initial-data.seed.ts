import { DataSource } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { Notification } from '../entities/notification.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

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

  // 알림 생성 함수
  const createNotification = async (user: UserAccount, type: string, message: string, post?: Post, comment?: Comment) => {
    const notification = notificationRepository.create({
      user,
      type,
      message,
      post,
      comment
    });
    await notificationRepository.save(notification);
    console.log(`${type} notification created for user ${user.login_id}`);
  };

  // S3에 이미지 업로드 함수
  const uploadImageToS3 = async () => {
    const response = await fetch('https://picsum.photos/640/480');
    const buffer = await response.arrayBuffer();
    const file = {
      buffer: Buffer.from(buffer),
      originalname: `image-${Date.now()}.jpg`,
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const sanitizedFileName = file.originalname.replace(/\s+/g, '-').replace(/[^\w.-]/g, '');
    const key = `images/${Date.now()}-${sanitizedFileName}`;
    
    try {
      const imageUrl = await s3Service.uploadFile(file, key);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw error;
    }
  };

  // 3명의 사용자 생성
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

  // 인맥 관계 및 친구 요청 생성
  for (let i = 0; i < users.length - 1; i++) {
    // 첫 번째 사용자와 두 번째 사용자 사이에 인맥 관계 생성
    const businessContact = businessContactRepository.create({
      userAccount: users[i],
      contact_user: users[i + 1],
    });
    await businessContactRepository.save(businessContact);
    console.log(`Business contact created: ${users[i].name} <-> ${users[i + 1].name}`);

    // 첫 번째 사용자가 세 번째 사용자에게 친구 요청 보내기
    if (i === 0) {
      const friendRequest = friendRequestRepository.create({
        sender: users[i],
        receiver: users[2],
        status: 'pending',
        created_at: faker.date.past(),
      });
      await friendRequestRepository.save(friendRequest);
      console.log(`Friend request sent from ${users[i].login_id} to ${users[2].login_id}`);

      // 친구 요청 알림 생성
      await createNotification(
        users[2],
        'friend_request',
        `${users[i].name}님이 친구 요청을 보냈습니다.`
      );
    }
  }

  // 각 사용자에 대해 1개의 게시물 생성
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
    console.log(`Post for user ${user.login_id} created with image: ${imageUrl}`);

    // 다른 사용자들이 이 게시물에 댓글과 좋아요 추가 및 알림 생성
    for (const otherUser of users.filter(u => u.user_id !== user.user_id)) {
      // 댓글 추가
      const comment = commentRepository.create({
        post,
        userAccount: otherUser,
        content: faker.lorem.sentence(),
        created_at: faker.date.past(),
        like_count: 0,
      });
      await commentRepository.save(comment);
      post.comments_count += 1;
      console.log(`Comment added by ${otherUser.login_id} to post ${post.post_id}`);

      // 댓글 알림 생성
      await createNotification(
        user,
        'comment',
        `${otherUser.name}님이 당신의 게시물에 댓글을 남겼습니다.`,
        post,
        comment
      );

      // 댓글 좋아요 추가
      const commentLike = commentLikeRepository.create({
        comment: comment,
        user: otherUser,
      });
      await commentLikeRepository.save(commentLike);
      comment.like_count += 1;
      await commentRepository.save(comment);
      console.log(`Comment like added by ${otherUser.login_id} to comment ${comment.comment_id}`);

       // 댓글 좋아요 알림 생성
       await createNotification(
        comment.userAccount, // 댓글 작성자에게 알림
        'like_comment',
        `${otherUser.name}님이 당신의 댓글에 좋아요를 눌렀습니다.`,
        post,
        comment
      );

      // 게시물 좋아요 추가
      const postLike = postLikeRepository.create({
        post,
        userAccount: otherUser,
        created_at: faker.date.past(),
      });
      await postLikeRepository.save(postLike);
      post.post_like_count += 1;
      console.log(`Like added by ${otherUser.login_id} to post ${post.post_id}`);

      // 게시물 좋아요 알림 생성
      await createNotification(
        user,
        'like_post',
        `${otherUser.name}님이 당신의 게시물에 좋아요를 눌렀습니다.`,
        post
      );
    }

    // 게시물의 댓글 수와 좋아요 수 업데이트
    await postRepository.save(post);
  }

  console.log('All seed data inserted successfully');
};