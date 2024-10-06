import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDeletedAtToPost1234567890123 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 'deleted_at' 컬럼이 이미 존재하는지 확인
        const hasDeletedAtColumn = await queryRunner.hasColumn('post', 'deleted_at');
        if (!hasDeletedAtColumn) {
            // 컬럼이 없을 경우 추가
            await queryRunner.addColumn('post', new TableColumn({
                name: 'deleted_at',
                type: 'timestamp',
                isNullable: true,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 'deleted_at' 컬럼이 존재하는지 확인
        const hasDeletedAtColumn = await queryRunner.hasColumn('post', 'deleted_at');
        if (hasDeletedAtColumn) {
            // 컬럼이 있을 경우 삭제
            await queryRunner.dropColumn('post', 'deleted_at');
        }
    }
}
