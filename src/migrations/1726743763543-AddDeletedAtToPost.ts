import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class AddDeletedAtToPost1234567890123 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('post', new TableColumn({
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('post', 'deleted_at');
    }

}