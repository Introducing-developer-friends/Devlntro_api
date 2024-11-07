import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class RemoveCreatedAtIndices1730972243552 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const postTable = await queryRunner.getTable("post");
        const notificationTable = await queryRunner.getTable("notification");

        // post 테이블에서 created_at 인덱스 삭제
        if (postTable?.indices.find(index => index.name === "IDX_0f8f2f0c0512fbecbe3034b804")) {
            await queryRunner.dropIndex('post', "IDX_0f8f2f0c0512fbecbe3034b804");
        }

        // notification 테이블에서 created_at 인덱스 삭
        if (notificationTable?.indices.find(index => index.name === "IDX_8bdc07e9c41ce8d83730f0f5d8")) {
            await queryRunner.dropIndex('notification', "IDX_8bdc07e9c41ce8d83730f0f5d8");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // post 테이블에 created_at 인덱스 다시 추가
        await queryRunner.createIndex('post', new TableIndex({
            name: "IDX_0f8f2f0c0512fbecbe3034b804",
            columnNames: ['created_at']
        }));

        // notification 테이블에 created_at 인덱스 다시 추가
        await queryRunner.createIndex('notification', new TableIndex({
            name: "IDX_8bdc07e9c41ce8d83730f0f5d8",
            columnNames: ['created_at']
        }));
    }
}
