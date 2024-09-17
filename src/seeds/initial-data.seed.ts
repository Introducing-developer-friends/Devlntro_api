import { DataSource } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';

export const seedInitialData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UserAccount);

  const newUser1 = {
    login_id: 'john_doe',
    password: 'password123',
    name: 'John Doe'
  };

  // 새로운 사용자 추가 시도
  try {

    const testUser1 = userRepository.create(newUser1); // 추가 사용자
    await userRepository.save(testUser1);
    console.log('Another seed data inserted successfully:', testUser1);

  } catch (error) {
    console.error('Error inserting new user:', error.message);
  }

  // 모든 사용자 조회 및 출력
  const allUsers = await userRepository.find();
  console.log('All users in database:', allUsers);
};
