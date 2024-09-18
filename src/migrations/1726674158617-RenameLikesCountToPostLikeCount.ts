import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameLikesCountToPostLikeCount1234567890123 implements MigrationInterface {
    name = 'RenameLikesCountToPostLikeCount1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE post
            CHANGE COLUMN likes_count post_like_count INT DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE post
            CHANGE COLUMN post_like_count likes_count INT DEFAULT 0
        `);
    }
}
