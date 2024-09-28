import { DataSource } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { BusinessProfile } from '../entities/business-profile.entity';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt'; // bcrypt 임포트
import fetch from 'node-fetch';
import * as path from 'path'; 
import * as fs from 'fs'; 

export const seedInitialData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UserAccount);
  const postRepository = dataSource.getRepository(Post);
  const commentRepository = dataSource.getRepository(Comment);
  const postLikeRepository = dataSource.getRepository(PostLike);
  const businessContactRepository = dataSource.getRepository(BusinessContact);
  const businessProfileRepository = dataSource.getRepository(BusinessProfile);

  const hashedPassword = await bcrypt.hash('password123', 10); // 10은 salt rounds
  // 랜덤 사용자 생성
  const createRandomUser = async () => {
    const user = userRepository.create({
      login_id: faker.internet.userName(),
      password: hashedPassword, // 실제 사용 시 해시 적용 필요
      confirm_password: hashedPassword,
      name: faker.person.fullName(),
    });
    await userRepository.save(user);

    // 비즈니스 프로필 생성
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

  // 사용자 3명 생성
  const users: UserAccount[] = [];
  for (let i = 0; i < 3; i++) {
    const user = await createRandomUser();
    users.push(user);
    console.log(`User ${user.login_id} created`);
  }

  // 랜덤 인맥 관계 생성
  for (let i = 0; i < 2; i++) {
    const user = faker.helpers.arrayElement(users);
    const contactUser = faker.helpers.arrayElement(users);
    if (user.user_id !== contactUser.user_id) {
      const businessContact = businessContactRepository.create({
        userAccount: user,
        contact_user: contactUser,
      });
      await businessContactRepository.save(businessContact);
      console.log(`Business contact relationship created between ${user.name} and ${contactUser.name}`);
    }
  }
  // 이미지 다운로드 및 저장 함수
  const downloadImage = async () => {
    const response = await fetch('https://loremflickr.com/320/240');
    const buffer = await response.buffer();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `image-${uniqueSuffix}.png`;
    const filePath = path.join('uploads', filename);
    fs.writeFileSync(filePath, buffer);
    return `uploads\\${filename}`; // Windows 스타일 경로 반환
  };

  // 사용자당 랜덤 게시물 1개 생성
  for (const user of users) {
    const postCount = 1;
    for (let j = 0; j < postCount; j++) {
      const savedImagePath = await downloadImage();

      const post = postRepository.create({
        user,
        image_url: savedImagePath,
        content: faker.lorem.sentence(),
        created_at: faker.date.past(),
        post_like_count: faker.number.int({ min: 0, max: 10 }),
        comments_count: faker.number.int({ min: 0, max: 5 }),
      });
      await postRepository.save(post);
      console.log(`Post for user ${user.login_id} created with image: ${savedImagePath}`);

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
  }

  console.log('All seed data inserted successfully');
};
