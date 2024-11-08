import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserLoginIdConstraint1731056098337 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // 1. 기존 인덱스들 삭제
            const table = await queryRunner.getTable("user_account");
            const indexes = table.indices.filter(
                index => index.columnNames.includes('login_id') && 
                        index.name !== 'UQ_user_login_id'  // 유니크 제약조건은 남김
            );

            for (const index of indexes) {
                await queryRunner.dropIndex("user_account", index);
                console.log(`Dropped index ${index.name}`);
            }

            // 2. 유니크 제약조건 확인 및 추가 (없는 경우에만)
            const existingUniqueConstraint = table.indices.find(
                index => index.name === "UQ_user_login_id"
            );

            if (!existingUniqueConstraint) {
                await queryRunner.query(`
                    ALTER TABLE user_account
                    ADD CONSTRAINT UQ_user_login_id UNIQUE (login_id)
                `);
                console.log('Added unique constraint UQ_user_login_id');
            }

            console.log('Migration completed successfully!');

        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // 유니크 제약조건만 제거
            const table = await queryRunner.getTable("user_account");
            const uniqueConstraint = table.indices.find(
                index => index.name === "UQ_user_login_id"
            );

            if (uniqueConstraint) {
                await queryRunner.query(`
                    ALTER TABLE user_account
                    DROP INDEX UQ_user_login_id
                `);
                console.log('Removed unique constraint UQ_user_login_id');
            }

        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }
}