import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddLikesUniqueConstraints1731044092418 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // 중복 데이터 처리
            console.log('Cleaning up duplicate post likes...');
            await queryRunner.query(`
                DELETE p1 FROM post_like p1
                INNER JOIN post_like p2
                WHERE 
                    p1.post_id = p2.post_id
                    AND p1.user_id = p2.user_id
                    AND p1.post_like_id < p2.post_like_id
            `);

            console.log('Cleaning up duplicate comment likes...');
            await queryRunner.query(`
                DELETE c1 FROM comment_like c1
                INNER JOIN comment_like c2
                WHERE 
                    c1.comment_id = c2.comment_id
                    AND c1.user_id = c2.user_id
                    AND c1.comment_like_id < c2.comment_like_id
            `);

            // post_like 테이블의 유니크 인덱스 추가
            const postLikeTable = await queryRunner.getTable("post_like");
            const existingPostLikeIndex = postLikeTable.indices.find(
                index => index.name === "IDX_155b6bea641466e2d27ade96a4"
            );

            if (!existingPostLikeIndex) {
                await queryRunner.createIndex('post_like', new TableIndex({
                    name: "IDX_155b6bea641466e2d27ade96a4",
                    columnNames: ['post_id', 'user_id'],
                    isUnique: true
                }));
                console.log("Added unique index to post_like table");
            }

            // comment_like 테이블의 유니크 인덱스 추가
            const commentLikeTable = await queryRunner.getTable("comment_like");
            const existingCommentLikeIndex = commentLikeTable.indices.find(
                index => index.name === "IDX_b81e662a725f9440050ac6e4e2"
            );

            if (!existingCommentLikeIndex) {
                await queryRunner.createIndex('comment_like', new TableIndex({
                    name: "IDX_b81e662a725f9440050ac6e4e2",
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
            // post_like 테이블의 유니크 인덱스 제거
            const postLikeTable = await queryRunner.getTable("post_like");
            const postLikeIndex = postLikeTable.indices.find(
                index => index.name === "IDX_155b6bea641466e2d27ade96a4"
            );
            
            if (postLikeIndex) {
                await queryRunner.dropIndex("post_like", postLikeIndex);
                console.log("Removed unique index from post_like table");
            }

            // comment_like 테이블의 유니크 인덱스 제거
            const commentLikeTable = await queryRunner.getTable("comment_like");
            const commentLikeIndex = commentLikeTable.indices.find(
                index => index.name === "IDX_b81e662a725f9440050ac6e4e2"
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