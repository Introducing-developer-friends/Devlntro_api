import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class FixLikeIndexesSafe1731053842771 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // 1. post_like 테이블의 특정 인덱스만 제거
            const postLikeTable = await queryRunner.getTable("post_like");
            const oldPostLikeIndex = postLikeTable.indices.find(
                idx => idx.name === "IDX_155b6bea641466e2d27ade96a4"
            );
            
            if (oldPostLikeIndex) {
                await queryRunner.dropIndex("post_like", oldPostLikeIndex);
                console.log('Dropped old post_like index');
            }

            // 2. comment_like 테이블의 특정 인덱스만 제거
            const commentLikeTable = await queryRunner.getTable("comment_like");
            const oldCommentLikeIndex = commentLikeTable.indices.find(
                idx => idx.name === "IDX_b81e662a725f9440050ac6e4e2"
            );
            
            if (oldCommentLikeIndex) {
                await queryRunner.dropIndex("comment_like", oldCommentLikeIndex);
                console.log('Dropped old comment_like index');
            }

            // 3. 중복 데이터 제거 (post_like)
            console.log('Cleaning up duplicate post likes...');
            await queryRunner.query(`
                CREATE TEMPORARY TABLE temp_post_like AS
                SELECT MAX(post_like_id) as max_id
                FROM post_like
                GROUP BY post_id, user_id
            `);

            const postDeleteResult = await queryRunner.query(`
                DELETE FROM post_like 
                WHERE post_like_id NOT IN (SELECT max_id FROM temp_post_like)
            `);

            await queryRunner.query(`DROP TEMPORARY TABLE temp_post_like`);
            console.log('Cleaned up post likes:', postDeleteResult.affectedRows);

            // 4. 중복 데이터 제거 (comment_like)
            console.log('Cleaning up duplicate comment likes...');
            await queryRunner.query(`
                CREATE TEMPORARY TABLE temp_comment_like AS
                SELECT MAX(comment_like_id) as max_id
                FROM comment_like
                GROUP BY comment_id, user_id
            `);

            const commentDeleteResult = await queryRunner.query(`
                DELETE FROM comment_like 
                WHERE comment_like_id NOT IN (SELECT max_id FROM temp_comment_like)
            `);

            await queryRunner.query(`DROP TEMPORARY TABLE temp_comment_like`);
            console.log('Cleaned up comment likes:', commentDeleteResult.affectedRows);

            // 5. 새 인덱스 생성 (기존 것이 없는 경우에만)
            const newPostLikeIndex = postLikeTable.indices.find(
                idx => idx.name === "IDX_unique_post_like"
            );
            
            if (!newPostLikeIndex) {
                await queryRunner.createIndex('post_like', new TableIndex({
                    name: "IDX_unique_post_like",
                    columnNames: ['post_id', 'user_id'],
                    isUnique: true
                }));
                console.log('Added new post_like unique index');
            }

            const newCommentLikeIndex = commentLikeTable.indices.find(
                idx => idx.name === "IDX_unique_comment_like"
            );
            
            if (!newCommentLikeIndex) {
                await queryRunner.createIndex('comment_like', new TableIndex({
                    name: "IDX_unique_comment_like",
                    columnNames: ['comment_id', 'user_id'],
                    isUnique: true
                }));
                console.log('Added new comment_like unique index');
            }

            console.log('Migration completed successfully!');

        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 롤백은 생략 - 중복 데이터는 복구하지 않음
        console.log('No rollback needed');
    }
}