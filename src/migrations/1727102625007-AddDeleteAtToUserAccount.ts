import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToUserAccount1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE user_account ADD deletedAt TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE user_account DROP COLUMN deletedAt`);
    }
}