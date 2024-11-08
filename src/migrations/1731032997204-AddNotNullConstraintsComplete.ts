import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotNullConstraintsComplete1699420000000 implements MigrationInterface {
    
    // 테이블과 해당 테이블의 체크할 컬럼들을 정의
    private readonly tableColumns = {
        'post': ['user_id'],
        'comment': ['post_id', 'user_id'],
        'post_like': ['post_id', 'user_id'],
        'comment_like': ['comment_id', 'user_id'],
        'business_contact': ['user_id', 'contact_user_id'],
        'business_profile': ['user_id'],
        'notification': ['user_id'],
        'friend_request': ['sender_id', 'receiver_id']
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // 모든 테이블과 컬럼 존재 여부 확인
            console.log('Checking tables and columns existence...');
            await this.validateTablesAndColumns(queryRunner);

            // NOT NULL 제약조건 추가
            console.log('Adding NOT NULL constraints...');

            // Post 테이블 수정
            console.log('Modifying post table...');
            await queryRunner.query(`
                ALTER TABLE post
                MODIFY COLUMN user_id INT NOT NULL;
            `);

            // Comment 테이블 수정
            console.log('Modifying comment table...');
            await queryRunner.query(`
                ALTER TABLE comment
                MODIFY COLUMN post_id INT NOT NULL,
                MODIFY COLUMN user_id INT NOT NULL;
            `);

            // PostLike 테이블 수정
            console.log('Modifying post_like table...');
            await queryRunner.query(`
                ALTER TABLE post_like
                MODIFY COLUMN post_id INT NOT NULL,
                MODIFY COLUMN user_id INT NOT NULL;
            `);

            // CommentLike 테이블 수정
            console.log('Modifying comment_like table...');
            await queryRunner.query(`
                ALTER TABLE comment_like
                MODIFY COLUMN comment_id INT NOT NULL,
                MODIFY COLUMN user_id INT NOT NULL;
            `);

            // BusinessContact 테이블 수정
            console.log('Modifying business_contact table...');
            await queryRunner.query(`
                ALTER TABLE business_contact
                MODIFY COLUMN user_id INT NOT NULL,
                MODIFY COLUMN contact_user_id INT NOT NULL;
            `);

            // BusinessProfile 테이블 수정
            console.log('Modifying business_profile table...');
            await queryRunner.query(`
                ALTER TABLE business_profile
                MODIFY COLUMN user_id INT NOT NULL;
            `);

            // Notification 테이블 수정
            console.log('Modifying notification table...');
            await queryRunner.query(`
                ALTER TABLE notification
                MODIFY COLUMN user_id INT NOT NULL;
            `);

            // FriendRequest 테이블 수정
            console.log('Modifying friend_request table...');
            await queryRunner.query(`
                ALTER TABLE friend_request
                MODIFY COLUMN sender_id INT NOT NULL,
                MODIFY COLUMN receiver_id INT NOT NULL;
            `);

            console.log('Migration completed successfully!');

        } catch (error) {
            console.error('Migration failed:', error);
            console.log('Starting rollback...');
            await this.down(queryRunner);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // Post 테이블 롤백
            console.log('Rolling back post table...');
            await queryRunner.query(`
                ALTER TABLE post
                MODIFY COLUMN user_id INT NULL;
            `);

            // Comment 테이블 롤백
            console.log('Rolling back comment table...');
            await queryRunner.query(`
                ALTER TABLE comment
                MODIFY COLUMN post_id INT NULL,
                MODIFY COLUMN user_id INT NULL;
            `);

            // PostLike 테이블 롤백
            console.log('Rolling back post_like table...');
            await queryRunner.query(`
                ALTER TABLE post_like
                MODIFY COLUMN post_id INT NULL,
                MODIFY COLUMN user_id INT NULL;
            `);

            // CommentLike 테이블 롤백
            console.log('Rolling back comment_like table...');
            await queryRunner.query(`
                ALTER TABLE comment_like
                MODIFY COLUMN comment_id INT NULL,
                MODIFY COLUMN user_id INT NULL;
            `);

            // BusinessContact 테이블 롤백
            console.log('Rolling back business_contact table...');
            await queryRunner.query(`
                ALTER TABLE business_contact
                MODIFY COLUMN user_id INT NULL,
                MODIFY COLUMN contact_user_id INT NULL;
            `);

            // BusinessProfile 테이블 롤백
            console.log('Rolling back business_profile table...');
            await queryRunner.query(`
                ALTER TABLE business_profile
                MODIFY COLUMN user_id INT NULL;
            `);

            // Notification 테이블 롤백
            console.log('Rolling back notification table...');
            await queryRunner.query(`
                ALTER TABLE notification
                MODIFY COLUMN user_id INT NULL;
            `);

            // FriendRequest 테이블 롤백
            console.log('Rolling back friend_request table...');
            await queryRunner.query(`
                ALTER TABLE friend_request
                MODIFY COLUMN sender_id INT NULL,
                MODIFY COLUMN receiver_id INT NULL;
            `);

            console.log('Rollback completed successfully!');

        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }

    private async validateTablesAndColumns(queryRunner: QueryRunner): Promise<void> {
        for (const [tableName, columns] of Object.entries(this.tableColumns)) {
            // 테이블 존재 여부 확인
            const tableExists = await queryRunner.hasTable(tableName);
            if (!tableExists) {
                throw new Error(`Table '${tableName}' does not exist`);
            }

            // 컬럼 존재 여부 확인
            const table = await queryRunner.getTable(tableName);
            for (const columnName of columns) {
                const column = table.columns.find(col => col.name === columnName);
                if (!column) {
                    throw new Error(`Column '${columnName}' does not exist in table '${tableName}'`);
                }
            }
            
            console.log(`Validated table '${tableName}' and its columns`);
        }
    }
}