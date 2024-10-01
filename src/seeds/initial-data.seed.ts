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

  // 랜덤 사용자 생성 함수
  const createRandomUser = async () => {
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

    return user;
  };

  // 4명의 사용자 생성
  const users: UserAccount[] = [];
  for (let i = 0; i < 4; i++) {
    const user = await createRandomUser();
    users.push(user);
    console.log(`User ${user.login_id} created`);
  }

  // 인맥 관계 생성 (각 사용자에게 2명의 인맥)
  for (let i = 0; i < users.length; i++) {
    const contacts = users.filter((_, index) => index !== i);
    for (let j = 0; j < 2; j++) {
      const contactIndex = (i + j + 1) % users.length;
      const businessContact = businessContactRepository.create({
        userAccount: users[i],
        contact_user: contacts[j],
      });
      await businessContactRepository.save(businessContact);
      console.log(`Business contact relationship created: ${users[i].name} -> ${contacts[j].name}`);
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
      post_like_count: faker.number.int({ min: 0, max: 10 }),
      comments_count: faker.number.int({ min: 0, max: 5 }),
    });
    await postRepository.save(post);
    console.log(`Post for user ${user.login_id} created with image: ${imageUrl}`);

    // 랜덤 댓글 생성
    const commentCount = faker.number.int({ min: 0, max: 5 });
    for (let k = 0; k < commentCount; k++) {
      const comment = commentRepository.create({
        post,
        userAccount: faker.helpers.arrayElement(users),
        content: faker.lorem.sentence(),
        created_at: faker.date.past(),
        like_count: faker.number.int({ min: 0, max: 5 }),
      });
      await commentRepository.save(comment);
      console.log(`Comment for post ${post.post_id} created`);
    }

    // 랜덤 좋아요 생성
    const likeCount = faker.number.int({ min: 0, max: 5 });
    for (let l = 0; l < likeCount; l++) {
      const postLike = postLikeRepository.create({
        post,
        userAccount: faker.helpers.arrayElement(users),
        created_at: faker.date.past(),
      });
      await postLikeRepository.save(postLike);
      console.log(`Like for post ${post.post_id} created`);
    }
  }

  console.log('All seed data inserted successfully');
};