import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class RemoveCascadeFromNotificationPost1730903335984 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. notification 테이블의 기존 postId 외래 키 삭제 (CASCADE가 있을 경우에만 제거)
        const notificationTable = await queryRunner.getTable("notification");
        if (notificationTable) {
            const existingForeignKey = notificationTable.foreignKeys.find(fk => fk.columnNames.includes("postId"));
            
            // 기존 외래 키가 존재할 경우에만 삭제
            if (existingForeignKey) {
                await queryRunner.dropForeignKey("notification", existingForeignKey);
            }
        }

        // 2. CASCADE 없이 새로운 외래 키 FK_notification_post 추가
        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_post",
            columnNames: ["postId"],
            referencedColumnNames: ["post_id"],
            referencedTableName: "post"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. 기존 CASCADE가 없는 외래 키 FK_notification_post 삭제
        await queryRunner.dropForeignKey("notification", "FK_notification_post");

        // 2. CASCADE 옵션을 포함한 외래 키 FK_notification_post 재추가
        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_post",
            columnNames: ["postId"],
            referencedColumnNames: ["post_id"],
            referencedTableName: "post",
            onDelete: "CASCADE"
        }));
    }
}
