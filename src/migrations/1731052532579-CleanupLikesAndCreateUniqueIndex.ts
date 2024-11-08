import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class CleanupLikesAndCreateUniqueIndex1731052532579 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // 1. 기존 데이터 검증
            const duplicatePostLikes = await queryRunner.query(`
                SELECT post_id, user_id, COUNT(*) as cnt
                FROM post_like
                GROUP BY post_id, user_id
                HAVING cnt > 1
            `);

            const duplicateCommentLikes = await queryRunner.query(`
                SELECT comment_id, user_id, COUNT(*) as cnt
                FROM comment_like
                GROUP BY comment_id, user_id
                HAVING cnt > 1
            `);

            console.log('Found duplicate post likes:', duplicatePostLikes.length);
            console.log('Found duplicate comment likes:', duplicateCommentLikes.length);

            // 2. post_like 테이블 중복 제거
            if (duplicatePostLikes.length > 0) {
                await queryRunner.query(`
                    CREATE TEMPORARY TABLE temp_post_like AS
                    SELECT MAX(post_like_id) as max_id
                    FROM post_like
                    GROUP BY post_id, user_id
                `);

                const deleteResult = await queryRunner.query(`
                    DELETE FROM post_like 
                    WHERE post_like_id NOT IN (SELECT max_id FROM temp_post_like)
                `);

                await queryRunner.query(`DROP TEMPORARY TABLE temp_post_like`);
                console.log('Cleaned up post likes:', deleteResult.affectedRows);
            }

            // 3. comment_like 테이블 중복 제거
            if (duplicateCommentLikes.length > 0) {
                await queryRunner.query(`
                    CREATE TEMPORARY TABLE temp_comment_like AS
                    SELECT MAX(comment_like_id) as max_id
                    FROM comment_like
                    GROUP BY comment_id, user_id
                `);

                const deleteResult = await queryRunner.query(`
                    DELETE FROM comment_like 
                    WHERE comment_like_id NOT IN (SELECT max_id FROM temp_comment_like)
                `);

                await queryRunner.query(`DROP TEMPORARY TABLE temp_comment_like`);
                console.log('Cleaned up comment likes:', deleteResult.affectedRows);
            }

            // 4. post_like 테이블 유니크 인덱스 추가
            const postLikeTable = await queryRunner.getTable("post_like");
            const existingPostLikeIndex = postLikeTable.indices.find(
                index => index.name === "IDX_unique_post_like"
            );

            if (!existingPostLikeIndex) {
                await queryRunner.createIndex('post_like', new TableIndex({
                    name: "IDX_unique_post_like",  // 새로운 인덱스 이름 사용
                    columnNames: ['post_id', 'user_id'],
                    isUnique: true
                }));
                console.log("Added unique index to post_like table");
            }

            // 5. comment_like 테이블 유니크 인덱스 추가
            const commentLikeTable = await queryRunner.getTable("comment_like");
            const existingCommentLikeIndex = commentLikeTable.indices.find(
                index => index.name === "IDX_unique_comment_like"  // 새로운 인덱스 이름 사용
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
            console.error("Migration failed:", error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // 1. post_like 테이블 인덱스 제거
            const postLikeTable = await queryRunner.getTable("post_like");
            const postLikeIndex = postLikeTable.indices.find(
                index => index.name === "IDX_unique_post_like"
            );
            
            if (postLikeIndex) {
                await queryRunner.dropIndex("post_like", postLikeIndex);
                console.log("Removed unique index from post_like table");
            }

            // 2. comment_like 테이블 인덱스 제거
            const commentLikeTable = await queryRunner.getTable("comment_like");
            const commentLikeIndex = commentLikeTable.indices.find(
                index => index.name === "IDX_unique_comment_like"
            );
            
            if (commentLikeIndex) {
                await queryRunner.dropIndex("comment_like", commentLikeIndex);
                console.log("Removed unique index from comment_like table");
            }

            console.log('Rollback completed successfully!');

        } catch (error) {
            console.error("Rollback failed:", error);
            throw error;
        }
    }
}