import { MigrationInterface, QueryRunner, TableIndex, Table } from "typeorm";

export class AddCreatedAtIndices1730903261891 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const postTable = await queryRunner.getTable("post");
        const notificationTable = await queryRunner.getTable("notification");

        // 1. post 테이블의 created_at 필드에 대한 인덱스 추가
        const existingPostIndex = postTable?.indices.find(
            index => index.name === "IDX_0f8f2f0c0512fbecbe3034b804"
        );

        // 인덱스가 이미 존재하지 않는 경우에만 생성
        if (!existingPostIndex) {
            await queryRunner.createIndex('post', new TableIndex({
                name: "IDX_0f8f2f0c0512fbecbe3034b804",
                columnNames: ['created_at']
            }));
        }

        // 2. notification 테이블의 created_at 필드에 대한 인덱스 추가
        const existingNotificationIndex = notificationTable?.indices.find(
            index => index.name === "IDX_8bdc07e9c41ce8d83730f0f5d8"
        );

        // 인덱스가 이미 존재하지 않는 경우에만 생성
        if (!existingNotificationIndex) {
            await queryRunner.createIndex('notification', new TableIndex({
                name: "IDX_8bdc07e9c41ce8d83730f0f5d8",
                columnNames: ['created_at']
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const postTable = await queryRunner.getTable("post");
        const notificationTable = await queryRunner.getTable("notification");

        // 1. post 테이블의 created_at 인덱스 삭제 (존재할 경우에만 삭제)
        if (postTable?.indices.find(index => index.name === "IDX_0f8f2f0c0512fbecbe3034b804")) {
            await queryRunner.dropIndex('post', "IDX_0f8f2f0c0512fbecbe3034b804");
        }

        // 2. notification 테이블의 created_at 인덱스 삭제 (존재할 경우에만 삭제)
        if (notificationTable?.indices.find(index => index.name === "IDX_8bdc07e9c41ce8d83730f0f5d8")) {
            await queryRunner.dropIndex('notification', "IDX_8bdc07e9c41ce8d83730f0f5d8");
        }
    }
}