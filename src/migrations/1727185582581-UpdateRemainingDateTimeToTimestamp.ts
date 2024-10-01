import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRemainingDateTimeToTimestamp1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // BusinessContact 테이블 수정
        await queryRunner.query(`
            ALTER TABLE business_contact 
            MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN deleted_at TIMESTAMP NULL
        `);

        // CommentLike 테이블 수정
        await queryRunner.query(`
            ALTER TABLE comment_like 
            MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        // PostLike 테이블 수정
        await queryRunner.query(`
            ALTER TABLE post_like 
            MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        // Comment 테이블 수정 (created_at만 수정)
        await queryRunner.query(`
            ALTER TABLE comment 
            MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        // Post 테이블 수정 (created_at만 수정)
        await queryRunner.query(`
            ALTER TABLE post 
            MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // BusinessContact 테이블 원복
        await queryRunner.query(`
            ALTER TABLE business_contact 
            MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN deleted_at DATETIME NULL
        `);

        // CommentLike 테이블 원복
        await queryRunner.query(`
            ALTER TABLE comment_like 
            MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `);

        // PostLike 테이블 원복
        await queryRunner.query(`
            ALTER TABLE post_like 
            MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `);

        // Comment 테이블 원복 (created_at만 원복)
        await queryRunner.query(`
            ALTER TABLE comment 
            MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `);

        // Post 테이블 원복 (created_at만 원복)
        await queryRunner.query(`
            ALTER TABLE post 
            MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `);
    }
}