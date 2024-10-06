import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // UserAccount 테이블 생성
        const userAccountTableExists = await queryRunner.hasTable('user_account');
        if (!userAccountTableExists) {
            await queryRunner.query(`
                CREATE TABLE user_account (
                    user_id INT AUTO_INCREMENT PRIMARY KEY,
                    login_id VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL
                )
            `);
        }

        // BusinessProfile 테이블 생성
        const businessProfileTableExists = await queryRunner.hasTable('business_profile');
        if (!businessProfileTableExists) {
            await queryRunner.query(`
                CREATE TABLE business_profile (
                    profile_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT UNIQUE,
                    company VARCHAR(100) NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    position VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                )
            `);
        }

        // BusinessContact 테이블 생성
        const businessContactTableExists = await queryRunner.hasTable('business_contact');
        if (!businessContactTableExists) {
            await queryRunner.query(`
                CREATE TABLE business_contact (
                    contact_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    contact_user_id INT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user_account(user_id),
                    FOREIGN KEY (contact_user_id) REFERENCES user_account(user_id)
                )
            `);
        }

        // Post 테이블 생성
        const postTableExists = await queryRunner.hasTable('post');
        if (!postTableExists) {
            await queryRunner.query(`
                CREATE TABLE post (
                    post_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    image_url VARCHAR(255),
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    likes_count INT DEFAULT 0,
                    comments_count INT DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                )
            `);
        }

        // Comment 테이블 생성
        const commentTableExists = await queryRunner.hasTable('comment');
        if (!commentTableExists) {
            await queryRunner.query(`
                CREATE TABLE comment (
                    comment_id INT AUTO_INCREMENT PRIMARY KEY,
                    post_id INT,
                    user_id INT,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    like_count INT DEFAULT 0,
                    FOREIGN KEY (post_id) REFERENCES post(post_id),
                    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                )
            `);
        }

        // PostLike 테이블 생성
        const postLikeTableExists = await queryRunner.hasTable('post_like');
        if (!postLikeTableExists) {
            await queryRunner.query(`
                CREATE TABLE post_like (
                    post_like_id INT AUTO_INCREMENT PRIMARY KEY,
                    post_id INT,
                    user_id INT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (post_id) REFERENCES post(post_id),
                    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                )
            `);
        }

        // CommentLike 테이블 생성
        const commentLikeTableExists = await queryRunner.hasTable('comment_like');
        if (!commentLikeTableExists) {
            await queryRunner.query(`
                CREATE TABLE comment_like (
                    comment_like_id INT AUTO_INCREMENT PRIMARY KEY,
                    comment_id INT,
                    user_id INT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (comment_id) REFERENCES comment(comment_id),
                    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 테이블 삭제 (생성의 역순으로) - 삭제하기 전에 테이블 존재 확인
        const commentLikeTableExists = await queryRunner.hasTable('comment_like');
        if (commentLikeTableExists) {
            await queryRunner.query(`DROP TABLE comment_like`);
        }

        const postLikeTableExists = await queryRunner.hasTable('post_like');
        if (postLikeTableExists) {
            await queryRunner.query(`DROP TABLE post_like`);
        }

        const commentTableExists = await queryRunner.hasTable('comment');
        if (commentTableExists) {
            await queryRunner.query(`DROP TABLE comment`);
        }

        const postTableExists = await queryRunner.hasTable('post');
        if (postTableExists) {
            await queryRunner.query(`DROP TABLE post`);
        }

        const businessContactTableExists = await queryRunner.hasTable('business_contact');
        if (businessContactTableExists) {
            await queryRunner.query(`DROP TABLE business_contact`);
        }

        const businessProfileTableExists = await queryRunner.hasTable('business_profile');
        if (businessProfileTableExists) {
            await queryRunner.query(`DROP TABLE business_profile`);
        }

        const userAccountTableExists = await queryRunner.hasTable('user_account');
        if (userAccountTableExists) {
            await queryRunner.query(`DROP TABLE user_account`);
        }
    }
}
