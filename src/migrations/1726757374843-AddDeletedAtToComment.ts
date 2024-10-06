import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDeletedAtToComment1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('comment', 'deleted_at');
        if (!hasColumn) {
            await queryRunner.addColumn('comment', new TableColumn({
                name: 'deleted_at',
                type: 'timestamp',
                isNullable: true,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('comment', 'deleted_at');
        if (hasColumn) {
            await queryRunner.dropColumn('comment', 'deleted_at');
        }
    }
}