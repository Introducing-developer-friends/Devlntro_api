import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTable1700000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // notification 테이블 생성
      await queryRunner.query(`
                CREATE TABLE notification (
                    notification_id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_id INT NOT NULL,
                    receiver_id INT NOT NULL,
                    post_id INT NULL,
                    comment_id INT NULL,
                    type VARCHAR(50) NOT NULL,
                    message VARCHAR(255) NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT false,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT FK_notification_sender FOREIGN KEY (sender_id)
                        REFERENCES user_account(user_id),
                    CONSTRAINT FK_notification_receiver FOREIGN KEY (receiver_id)
                        REFERENCES user_account(user_id),
                    CONSTRAINT FK_notification_post FOREIGN KEY (post_id)
                        REFERENCES post(post_id),
                    CONSTRAINT FK_notification_comment FOREIGN KEY (comment_id)
                        REFERENCES comment(comment_id)
                )
            `);

      console.log('Notification table created successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // 외래 키 제약 조건을 비활성화한 후 테이블 삭제
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      await queryRunner.query('DROP TABLE IF EXISTS notification');
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log('Notification table dropped successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}
