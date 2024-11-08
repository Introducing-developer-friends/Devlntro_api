import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class RestoreCompositeIndices1730972243553 implements MigrationInterface {
   public async up(queryRunner: QueryRunner): Promise<void> {
       // Comment 엔티티의 복합 인덱스 추가
       const commentTable = await queryRunner.getTable("comment");
       if (commentTable && !commentTable.indices.find(index => index.name === "IDX_comment_post_created_at")) {
           await queryRunner.createIndex('comment', new TableIndex({
               name: "IDX_comment_post_created_at",
               columnNames: ['post_id', 'created_at']
           }));
       }

       // Post 엔티티의 복합 인덱스 추가
       const postTable = await queryRunner.getTable("post");
       if (postTable && !postTable.indices.find(index => index.name === "IDX_post_user_created_at")) {
           await queryRunner.createIndex('post', new TableIndex({
               name: "IDX_post_user_created_at",
               columnNames: ['user_id', 'created_at']
           }));
       }

       // Notification 엔티티의 복합 인덱스 추가
       const notificationTable = await queryRunner.getTable("notification");
       if (notificationTable && !notificationTable.indices.find(index => index.name === "IDX_notification_user_created_at")) {
           await queryRunner.createIndex('notification', new TableIndex({
               name: "IDX_notification_user_created_at",
               columnNames: ['user_id', 'created_at']
           }));
       }
   }

   public async down(queryRunner: QueryRunner): Promise<void> {
       // 복합 인덱스 삭제
       const commentTable = await queryRunner.getTable("comment");
       if (commentTable && commentTable.indices.find(index => index.name === "IDX_comment_post_created_at")) {
           await queryRunner.dropIndex('comment', "IDX_comment_post_created_at");
       }

       const postTable = await queryRunner.getTable("post");
       if (postTable && postTable.indices.find(index => index.name === "IDX_post_user_created_at")) {
           await queryRunner.dropIndex('post', "IDX_post_user_created_at");
       }

       const notificationTable = await queryRunner.getTable("notification");
       if (notificationTable && notificationTable.indices.find(index => index.name === "IDX_notification_user_created_at")) {
           await queryRunner.dropIndex('notification', "IDX_notification_user_created_at");
       }
   }
}
