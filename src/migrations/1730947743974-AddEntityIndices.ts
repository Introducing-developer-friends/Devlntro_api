import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddEntityIndices1730947743974 implements MigrationInterface {
   public async up(queryRunner: QueryRunner): Promise<void> {
       // Comment 엔티티의 복합 인덱스 (post_id, created_at) 추가
       const commentTable = await queryRunner.getTable("comment");
       const existingCommentIndex = commentTable?.indices.find(
           index => index.name === "IDX_comment_post_created_at"
       );
       if (!existingCommentIndex) {
           await queryRunner.createIndex('comment', new TableIndex({
               name: "IDX_comment_post_created_at",
               columnNames: ['post_id', 'created_at']
           }));
       }

       // Post 엔티티의 복합 인덱스 (user_id, created_at) 추가
       const postTable = await queryRunner.getTable("post");
       const existingPostIndex = postTable?.indices.find(
           index => index.name === "IDX_post_user_created_at"
       );
       if (!existingPostIndex) {
           await queryRunner.createIndex('post', new TableIndex({
               name: "IDX_post_user_created_at",
               columnNames: ['user_id', 'created_at']
           }));
       }

       // Notification 엔티티의 복합 인덱스 (user_id, created_at) 추가
       const notificationTable = await queryRunner.getTable("notification");
       const existingNotificationIndex = notificationTable?.indices.find(
           index => index.name === "IDX_notification_user_created_at"
       );
       if (!existingNotificationIndex) {
           await queryRunner.createIndex('notification', new TableIndex({
               name: "IDX_notification_user_created_at",
               columnNames: ['user_id', 'created_at']
           }));
       }

       // UserAccount의 login_id 인덱스 추가
       const userAccountTable = await queryRunner.getTable("user_account");
       const existingLoginIndex = userAccountTable?.indices.find(
           index => index.name === "IDX_user_login_id"
       );
       if (!existingLoginIndex) {
           await queryRunner.createIndex('user_account', new TableIndex({
               name: "IDX_user_login_id",
               columnNames: ['login_id']
           }));
       }

       // UserAccount의 login_id에 유니크 제약조건 추가
       const existingUniqueConstraint = userAccountTable?.uniques.find(
           unique => unique.name === "UQ_user_login_id"
       );
       if (!existingUniqueConstraint) {
           await queryRunner.query(`
               ALTER TABLE user_account
               ADD CONSTRAINT UQ_user_login_id UNIQUE (login_id)
           `);
       }
   }

   public async down(queryRunner: QueryRunner): Promise<void> {
       // Comment 엔티티의 복합 인덱스 (post_id, created_at) 삭제
       const commentTable = await queryRunner.getTable("comment");
       if (commentTable?.indices.find(index => index.name === "IDX_comment_post_created_at")) {
           await queryRunner.dropIndex('comment', "IDX_comment_post_created_at");
       }

       // Post 엔티티의 복합 인덱스 (user_id, created_at) 삭제
       const postTable = await queryRunner.getTable("post");
       if (postTable?.indices.find(index => index.name === "IDX_post_user_created_at")) {
           await queryRunner.dropIndex('post', "IDX_post_user_created_at");
       }

       // Notification 엔티티의 복합 인덱스 (user_id, created_at) 삭제
       const notificationTable = await queryRunner.getTable("notification");
       if (notificationTable?.indices.find(index => index.name === "IDX_notification_user_created_at")) {
           await queryRunner.dropIndex('notification', "IDX_notification_user_created_at");
       }

       // UserAccount의 login_id 인덱스 삭제
       const userAccountTable = await queryRunner.getTable("user_account");
       if (userAccountTable?.indices.find(index => index.name === "IDX_user_login_id")) {
           await queryRunner.dropIndex('user_account', "IDX_user_login_id");
       }

       // UserAccount의 login_id 유니크 제약조건 삭제
       if (userAccountTable?.uniques.find(unique => unique.name === "UQ_user_login_id")) {
           await queryRunner.query(`
               ALTER TABLE user_account
               DROP CONSTRAINT UQ_user_login_id
           `);
       }
   }
}
