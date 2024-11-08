import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOldLikeIndexes1731052847763 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // 1. post_like 테이블의 기존 인덱스 제거
            const postLikeTable = await queryRunner.getTable("post_like");
            const oldPostLikeIndex = postLikeTable.indices.find(
                index => index.name === "IDX_155b6bea641466e2d27ade96a4"
            );
            
            if (oldPostLikeIndex) {
                await queryRunner.dropIndex("post_like", oldPostLikeIndex);
                console.log("Removed old index from post_like table");
            }

            // 2. comment_like 테이블의 기존 인덱스 제거
            const commentLikeTable = await queryRunner.getTable("comment_like");
            const oldCommentLikeIndex = commentLikeTable.indices.find(
                index => index.name === "IDX_b81e662a725f9440050ac6e4e2"
            );
            
            if (oldCommentLikeIndex) {
                await queryRunner.dropIndex("comment_like", oldCommentLikeIndex);
                console.log("Removed old index from comment_like table");
            }

            console.log('Old indexes removed successfully!');

        } catch (error) {
            console.error("Migration failed:", error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // 롤백시 기존 인덱스 다시 생성
            const postLikeTable = await queryRunner.getTable("post_like");
            const existingPostIndex = postLikeTable.indices.find(
                index => index.name === "IDX_155b6bea641466e2d27ade96a4"
            );

            if (!existingPostIndex) {
                await queryRunner.query(`
                    CREATE UNIQUE INDEX IDX_155b6bea641466e2d27ade96a4 
                    ON post_like (post_id, user_id)
                `);
            }

            const commentLikeTable = await queryRunner.getTable("comment_like");
            const existingCommentIndex = commentLikeTable.indices.find(
                index => index.name === "IDX_b81e662a725f9440050ac6e4e2"
            );

            if (!existingCommentIndex) {
                await queryRunner.query(`
                    CREATE UNIQUE INDEX IDX_b81e662a725f9440050ac6e4e2 
                    ON comment_like (comment_id, user_id)
                `);
            }

            console.log('Old indexes restored successfully!');

        } catch (error) {
            console.error("Rollback failed:", error);
            throw error;
        }
    }
}