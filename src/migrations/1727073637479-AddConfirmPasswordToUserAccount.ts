import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConfirmPasswordToUserAccount1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 먼저 NULL을 허용하는 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE user_account
            ADD COLUMN confirm_password VARCHAR(255) NULL
        `);
        
        // 기존 password 값을 confirm_password에 복사
        await queryRunner.query(`
            UPDATE user_account
            SET confirm_password = password
        `);
        
        // NOT NULL 제약 조건 추가
        await queryRunner.query(`
            ALTER TABLE user_account
            MODIFY COLUMN confirm_password VARCHAR(255) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE user_account
            DROP COLUMN confirm_password
        `);
    }
}