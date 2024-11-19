import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1700000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // UserAccount 테이블 생성
            await queryRunner.query(`
                CREATE TABLE user_account (
                    user_id INT AUTO_INCREMENT PRIMARY KEY,
                    login_id VARCHAR(50) NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    confirm_password VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    current_token_version INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT UQ_user_login_id UNIQUE (login_id)
                )
            `);

            // BusinessProfile 테이블 생성
            await queryRunner.query(`
                CREATE TABLE business_profile (
                    business_profile_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    company VARCHAR(100) NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    position VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT FK_business_profile_user FOREIGN KEY (user_id) 
                        REFERENCES user_account(user_id),
                    CONSTRAINT UQ_business_profile_user UNIQUE (user_id)
                )
            `);

            // BusinessContact 테이블 생성
            await queryRunner.query(`
                CREATE TABLE business_contact (
                    business_contact_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    contact_user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT FK_business_contact_user FOREIGN KEY (user_id) 
                        REFERENCES user_account(user_id),
                    CONSTRAINT FK_business_contact_contact_user FOREIGN KEY (contact_user_id) 
                        REFERENCES user_account(user_id)
                )
            `);

            // Post 테이블 생성
            await queryRunner.query(`
                CREATE TABLE post (
                    post_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    image_url VARCHAR(255),
                    content TEXT NOT NULL,
                    post_like_count INT DEFAULT 0,
                    post_comments_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT FK_post_user FOREIGN KEY (user_id) 
                        REFERENCES user_account(user_id)
                )
            `);

            // Comment 테이블 생성
            await queryRunner.query(`
                CREATE TABLE comment (
                    comment_id INT AUTO_INCREMENT PRIMARY KEY,
                    post_id INT NOT NULL,
                    user_id INT NOT NULL,
                    content TEXT NOT NULL,
                    comment_like_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    CONSTRAINT FK_comment_post FOREIGN KEY (post_id) 
                        REFERENCES post(post_id),
                    CONSTRAINT FK_comment_user FOREIGN KEY (user_id) 
                        REFERENCES user_account(user_id)
                )
            `);

            // PostLike 테이블 생성
            await queryRunner.query(`
                CREATE TABLE post_like (
                    post_like_id INT AUTO_INCREMENT PRIMARY KEY,
                    post_id INT NOT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT FK_post_like_post FOREIGN KEY (post_id) 
                        REFERENCES post(post_id),
                    CONSTRAINT FK_post_like_user FOREIGN KEY (user_id) 
                        REFERENCES user_account(user_id),
                    CONSTRAINT UQ_post_like_user_post UNIQUE (user_id, post_id)
                )
            `);

            // CommentLike 테이블 생성
            await queryRunner.query(`
                CREATE TABLE comment_like (
                    comment_like_id INT AUTO_INCREMENT PRIMARY KEY,
                    comment_id INT NOT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT FK_comment_like_comment FOREIGN KEY (comment_id) 
                        REFERENCES comment(comment_id),
                    CONSTRAINT FK_comment_like_user FOREIGN KEY (user_id) 
                        REFERENCES user_account(user_id),
                    CONSTRAINT UQ_comment_like_user_comment UNIQUE (user_id, comment_id)
                )
            `);

        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // 외래키 제약조건 비활성화
            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

            // 테이블 삭제 (생성의 역순)
            const tables = [
                'comment_like',
                'post_like',
                'comment',
                'post',
                'business_contact',
                'business_profile',
                'user_account'
            ];

            for (const table of tables) {
                await queryRunner.query(`DROP TABLE IF EXISTS ${table}`);
            }

            // 외래키 제약조건 다시 활성화
            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }
}