import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class RenameLikesCountToPostLikeCount1234567890123 implements MigrationInterface {
    name = 'RenameLikesCountToPostLikeCount1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 'likes_count' 컬럼이 있는지 확인
        const table = await queryRunner.getTable('post');
        const likesCountColumn = table?.findColumnByName('likes_count');

        if (likesCountColumn) {
            // 컬럼이 존재할 경우에만 이름 변경
            await queryRunner.query(`
                ALTER TABLE post
                CHANGE COLUMN likes_count post_like_count INT DEFAULT 0
            `);
        } else {
            console.log('likes_count column does not exist, skipping migration.');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 'post_like_count' 컬럼이 있는지 확인
        const table = await queryRunner.getTable('post');
        const postLikeCountColumn = table?.findColumnByName('post_like_count');

        if (postLikeCountColumn) {
            // 롤백 시에 컬럼이 존재할 경우에만 이름 변경
            await queryRunner.query(`
                ALTER TABLE post
                CHANGE COLUMN post_like_count likes_count INT DEFAULT 0
            `);
        } else {
            console.log('post_like_count column does not exist, skipping migration.');
        }
    }
}
