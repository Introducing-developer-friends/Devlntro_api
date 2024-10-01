import { MigrationInterface, QueryRunner } from "typeorm"

export class AddDeletedAtToBusinessContact1632152400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE business_contact ADD COLUMN deleted_at DATETIME NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE business_contact DROP COLUMN deleted_at`);
    }

}