import { DataSource } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
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
  const businessContactRepository = dataSource.getRepository(BusinessContact);
  const businessProfileRepository = dataSource.getRepository(BusinessProfile);

  const configService = new ConfigService();
  const s3Service = new S3Service(configService);

  const hashedPassword = await bcrypt.hash('password123', 10);

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

  // 모든 사용자 간에 인맥 관계 생성
  for (let i = 0; i < users.length - 1; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const businessContact = businessContactRepository.create({
        userAccount: users[i],
        contact_user: users[j],
      });
      await businessContactRepository.save(businessContact);
      console.log(`Business contact created: ${users[i].name} <-> ${users[j].name}`);
    }
  }

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

    // 다른 사용자들이 이 게시물에 댓글과 좋아요 추가
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

      // 좋아요 추가
      const postLike = postLikeRepository.create({
        post,
        userAccount: otherUser,
        created_at: faker.date.past(),
      });
      await postLikeRepository.save(postLike);
      post.post_like_count += 1;
      console.log(`Like added by ${otherUser.login_id} to post ${post.post_id}`);
    }

    // 게시물의 댓글 수와 좋아요 수 업데이트
    await postRepository.save(post);
  }

  console.log('All seed data inserted successfully');
};