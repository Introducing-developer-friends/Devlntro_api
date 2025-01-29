import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFriendRequestTable1700000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // friend_request 테이블 생성
      await queryRunner.query(`
                CREATE TABLE friend_request (
                    request_id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_id INT NOT NULL,
                    receiver_id INT NOT NULL,
                    status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT FK_friend_request_sender FOREIGN KEY (sender_id)
                        REFERENCES user_account(user_id),
                    CONSTRAINT FK_friend_request_receiver FOREIGN KEY (receiver_id)
                        REFERENCES user_account(user_id)
                )
            `);

      console.log('Friend request table created successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // 외래 키 제약 조건을 비활성화한 후 테이블 삭제
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      await queryRunner.query('DROP TABLE IF EXISTS friend_request');
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log('Friend request table dropped successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}
