import { DataSource } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { BusinessContact } from '../entities/business-contact.entity';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt'; // bcrypt 임포트

export const seedInitialData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UserAccount);
  const postRepository = dataSource.getRepository(Post);
  const commentRepository = dataSource.getRepository(Comment);
  const postLikeRepository = dataSource.getRepository(PostLike);
  const businessContactRepository = dataSource.getRepository(BusinessContact);


  const hashedPassword = await bcrypt.hash('password123', 10); // 10은 salt rounds
  // 랜덤 사용자 생성
  const createRandomUser = async () => {
    const user = userRepository.create({
      login_id: faker.internet.userName(),
      password: hashedPassword, // 실제 사용 시 해시 적용 필요
      name: faker.person.fullName(),
    });
    await userRepository.save(user);
    return user;
  };

  // 사용자 10명 생성
  const users: UserAccount[] = [];
  for (let i = 0; i < 10; i++) {
    const user = await createRandomUser();
    users.push(user);
    console.log(`User ${user.login_id} created`);
  }

  // 랜덤 인맥 관계 생성
  for (let i = 0; i < 5; i++) {
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

  // 사용자당 랜덤 게시물 2~3개 생성
  for (const user of users) {
    const postCount = faker.number.int({ min: 2, max: 3 });
    for (let j = 0; j < postCount; j++) {
      const post = postRepository.create({
        user,
        image_url: faker.image.url(),
        content: faker.lorem.sentence(),
        created_at: faker.date.past(),
        post_like_count: faker.number.int({ min: 0, max: 10 }),
        comments_count: faker.number.int({ min: 0, max: 5 }),
      });
      await postRepository.save(post);
      console.log(`Post for user ${user.login_id} created`);

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
