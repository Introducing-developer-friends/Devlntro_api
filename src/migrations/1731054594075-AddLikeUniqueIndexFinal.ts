import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddLikeUniqueIndexFinal1731054594075 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // post_like 테이블 유니크 인덱스 추가
            const postLikeTable = await queryRunner.getTable("post_like");
            const existingPostLikeIndex = postLikeTable.indices.find(
                index => index.name === "IDX_unique_post_like"
            );

            if (!existingPostLikeIndex) {
                await queryRunner.createIndex('post_like', new TableIndex({
                    name: "IDX_unique_post_like",
                    columnNames: ['post_id', 'user_id'],
                    isUnique: true
                }));
                console.log("Added unique index to post_like table");
            }

            // comment_like 테이블 유니크 인덱스 추가
            const commentLikeTable = await queryRunner.getTable("comment_like");
            const existingCommentLikeIndex = commentLikeTable.indices.find(
                index => index.name === "IDX_unique_comment_like"
            );

            if (!existingCommentLikeIndex) {
                await queryRunner.createIndex('comment_like', new TableIndex({
                    name: "IDX_unique_comment_like",
                    columnNames: ['comment_id', 'user_id'],
                    isUnique: true
                }));
                console.log("Added unique index to comment_like table");
            }

            console.log('Migration completed successfully!');
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            const postLikeTable = await queryRunner.getTable("post_like");
            const commentLikeTable = await queryRunner.getTable("comment_like");

            // 인덱스 제거
            const postLikeIndex = postLikeTable.indices.find(
                idx => idx.name === "IDX_unique_post_like"
            );
            if (postLikeIndex) {
                await queryRunner.dropIndex("post_like", postLikeIndex);
            }

            const commentLikeIndex = commentLikeTable.indices.find(
                idx => idx.name === "IDX_unique_comment_like"
            );
            if (commentLikeIndex) {
                await queryRunner.dropIndex("comment_like", commentLikeIndex);
            }

            console.log('Rollback completed successfully!');
        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }
}