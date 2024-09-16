import { DataSource } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';

export const seedInitialData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UserAccount);

  // 새로운 사용자 데이터
  const newUser = {
    login_id: 'teddddddddddd',
    password: 'newpassword12322222222',
    name: 'New Test Usersdas'
  };

  // 새 사용자 추가 시도
  try {
    const testUser = userRepository.create(newUser);
    await userRepository.save(testUser);
    console.log('New seed data inserted successfully:', testUser);
  } catch (error) {
    console.error('Error inserting new user:', error.message);
  }

  // 모든 사용자 조회 및 출력
  const allUsers = await userRepository.find();
  console.log('All users in database:', allUsers);
};