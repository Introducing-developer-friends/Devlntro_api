import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokenTable1700000000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`
                CREATE TABLE refresh_token (
                    refresh_token_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    token VARCHAR(500) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT FK_refresh_token_user FOREIGN KEY (user_id)
                        REFERENCES user_account(user_id),
                    CONSTRAINT UQ_refresh_token UNIQUE (token)
                )
            `);

      console.log('RefreshToken table created successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      await queryRunner.query('DROP TABLE IF EXISTS refresh_token');
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log('RefreshToken table dropped successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}
