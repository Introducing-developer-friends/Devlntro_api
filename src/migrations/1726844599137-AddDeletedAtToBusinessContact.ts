import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToBusinessContact1632152400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 'deleted_at' 컬럼이 존재하는지 확인
        const hasDeletedAtColumn = await queryRunner.hasColumn('business_contact', 'deleted_at');
        if (!hasDeletedAtColumn) {
            // 컬럼이 없을 경우 추가
            await queryRunner.query(`ALTER TABLE business_contact ADD COLUMN deleted_at DATETIME NULL`);
        } else {
            console.log('deleted_at column already exists, skipping migration.');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 'deleted_at' 컬럼이 존재하는지 확인
        const hasDeletedAtColumn = await queryRunner.hasColumn('business_contact', 'deleted_at');
        if (hasDeletedAtColumn) {
            // 컬럼이 있을 경우 삭제
            await queryRunner.query(`ALTER TABLE business_contact DROP COLUMN deleted_at`);
        }
    }
}
