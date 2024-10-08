import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDeletedAtToBusinessProfile1697123456789 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasDeletedAtColumn = await queryRunner.hasColumn('business_profile', 'deletedAt');
        if (!hasDeletedAtColumn) {
            await queryRunner.addColumn('business_profile', new TableColumn({
                name: 'deletedAt',
                type: 'datetime',
                isNullable: true,
            }));
        } else {
            console.log('deletedAt column already exists in business_profile, skipping migration.');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasDeletedAtColumn = await queryRunner.hasColumn('business_profile', 'deletedAt');
        if (hasDeletedAtColumn) {
            await queryRunner.dropColumn('business_profile', 'deletedAt');
        }
    }
}