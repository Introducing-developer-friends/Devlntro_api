import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class RemoveCascade1730901315571 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // 1. friend_request 테이블의 기존 외래 키 (sender_id, receiver_id) 삭제
        const friendRequestTable = await queryRunner.getTable("friend_request");
        if (friendRequestTable) {
            const fkSender = friendRequestTable.foreignKeys.find(fk => fk.columnNames.includes("sender_id"));
            if (fkSender) {
                await queryRunner.dropForeignKey("friend_request", fkSender);
            }

            const fkReceiver = friendRequestTable.foreignKeys.find(fk => fk.columnNames.includes("receiver_id"));
            if (fkReceiver) {
                await queryRunner.dropForeignKey("friend_request", fkReceiver);
            }
        }

        // 2. notification 테이블의 모든 외래 키 삭제
        const notificationTable = await queryRunner.getTable("notification");
        if (notificationTable) {
            const foreignKeys = notificationTable.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("notification", foreignKey);
            }
        }

        // 3. friend_request와 notification 테이블에 CASCADE 없이 새로운 외래 키 추가
        await queryRunner.createForeignKey("friend_request", new TableForeignKey({
            name: "FK_friend_request_sender",
            columnNames: ["sender_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account"
        }));

        await queryRunner.createForeignKey("friend_request", new TableForeignKey({
            name: "FK_friend_request_receiver",
            columnNames: ["receiver_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account"
        }));

        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_user",
            columnNames: ["user_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account"
        }));

        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_post",
            columnNames: ["postId"],
            referencedColumnNames: ["post_id"],
            referencedTableName: "post"
        }));

        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_comment",
            columnNames: ["commentId"],
            referencedColumnNames: ["comment_id"],
            referencedTableName: "comment"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. CASCADE 없는 외래 키 삭제
        await queryRunner.dropForeignKey("friend_request", "FK_friend_request_sender");
        await queryRunner.dropForeignKey("friend_request", "FK_friend_request_receiver");
        await queryRunner.dropForeignKey("notification", "FK_notification_user");
        await queryRunner.dropForeignKey("notification", "FK_notification_post");
        await queryRunner.dropForeignKey("notification", "FK_notification_comment");

        // 2. CASCADE 포함된 원래 외래 키 복구
        await queryRunner.createForeignKey("friend_request", new TableForeignKey({
            name: "FK_friend_request_sender",
            columnNames: ["sender_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("friend_request", new TableForeignKey({
            name: "FK_friend_request_receiver",
            columnNames: ["receiver_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_user",
            columnNames: ["user_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_post",
            columnNames: ["postId"],
            referencedColumnNames: ["post_id"],
            referencedTableName: "post",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("notification", new TableForeignKey({
            name: "FK_notification_comment",
            columnNames: ["commentId"],
            referencedColumnNames: ["comment_id"],
            referencedTableName: "comment",
            onDelete: "CASCADE"
        }));
    }
}