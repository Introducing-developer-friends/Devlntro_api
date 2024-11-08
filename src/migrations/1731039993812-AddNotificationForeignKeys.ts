import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class AddNotificationForeignKeys1731039993812 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // notification 테이블 존재 여부 확인
            const notificationExists = await queryRunner.hasTable("notification");
            if (!notificationExists) {
                throw new Error("notification table does not exist");
            }

            // post 테이블 존재 여부 확인
            const postExists = await queryRunner.hasTable("post");
            if (!postExists) {
                throw new Error("post table does not exist");
            }

            // comment 테이블 존재 여부 확인
            const commentExists = await queryRunner.hasTable("comment");
            if (!commentExists) {
                throw new Error("comment table does not exist");
            }

            // postId 컬럼에 대한 외래 키 추가
            const postForeignKey = new TableForeignKey({
                name: "FK_notification_post",
                columnNames: ["postId"],
                referencedColumnNames: ["post_id"],
                referencedTableName: "post"
            });

            // commentId 컬럼에 대한 외래 키 추가
            const commentForeignKey = new TableForeignKey({
                name: "FK_notification_comment",
                columnNames: ["commentId"],
                referencedColumnNames: ["comment_id"],
                referencedTableName: "comment"
            });

            // 기존 외래 키가 있는지 확인하고 없는 경우에만 추가
            const table = await queryRunner.getTable("notification");
            const existingPostFK = table.foreignKeys.find(fk => fk.columnNames.includes("postId"));
            const existingCommentFK = table.foreignKeys.find(fk => fk.columnNames.includes("commentId"));

            if (!existingPostFK) {
                await queryRunner.createForeignKey("notification", postForeignKey);
                console.log("Added foreign key for postId in notification table");
            } else {
                console.log("Foreign key for postId already exists");
            }

            if (!existingCommentFK) {
                await queryRunner.createForeignKey("notification", commentForeignKey);
                console.log("Added foreign key for commentId in notification table");
            } else {
                console.log("Foreign key for commentId already exists");
            }

        } catch (error) {
            console.error("Migration failed:", error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // 외래 키 제거
            const table = await queryRunner.getTable("notification");
            
            const postFK = table.foreignKeys.find(fk => fk.columnNames.includes("postId"));
            if (postFK) {
                await queryRunner.dropForeignKey("notification", postFK);
                console.log("Removed foreign key for postId");
            }

            const commentFK = table.foreignKeys.find(fk => fk.columnNames.includes("commentId"));
            if (commentFK) {
                await queryRunner.dropForeignKey("notification", commentFK);
                console.log("Removed foreign key for commentId");
            }

        } catch (error) {
            console.error("Rollback failed:", error);
            throw error;
        }
    }
}