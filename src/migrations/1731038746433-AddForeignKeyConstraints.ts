import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForeignKeyConstraints1731038746433 implements MigrationInterface {
    // 모든 테이블과 их의 외래 키 정의
    private readonly tableConstraints = {
        business_profile: [
            {
                name: 'FK_business_profile_user',
                column: 'user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            }
        ],
        business_contact: [
            {
                name: 'FK_business_contact_user',
                column: 'user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            },
            {
                name: 'FK_business_contact_contact_user',
                column: 'contact_user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            }
        ],
        post: [
            {
                name: 'FK_post_user',
                column: 'user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            }
        ],
        comment: [
            {
                name: 'FK_comment_user',
                column: 'user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            },
            {
                name: 'FK_comment_post',
                column: 'post_id',
                referencedTable: 'post',
                referencedColumn: 'post_id'
            }
        ],
        post_like: [
            {
                name: 'FK_post_like_user',
                column: 'user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            },
            {
                name: 'FK_post_like_post',
                column: 'post_id',
                referencedTable: 'post',
                referencedColumn: 'post_id'
            }
        ],
        comment_like: [
            {
                name: 'FK_comment_like_user',
                column: 'user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            },
            {
                name: 'FK_comment_like_comment',
                column: 'comment_id',
                referencedTable: 'comment',
                referencedColumn: 'comment_id'
            }
        ],
        friend_request: [
            {
                name: 'FK_friend_request_sender',
                column: 'sender_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            },
            {
                name: 'FK_friend_request_receiver',
                column: 'receiver_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            }
        ],
        notification: [
            {
                name: 'FK_notification_user',
                column: 'user_id',
                referencedTable: 'user_account',
                referencedColumn: 'user_id'
            }
        ]
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {

            // 모든 테이블 존재 여부 확인
            for (const tableName of Object.keys(this.tableConstraints)) {
                const exists = await queryRunner.hasTable(tableName);
                if (!exists) {
                    throw new Error(`Table ${tableName} does not exist. Migration cannot proceed.`);
                }
            }

            // 각 테이블별로 외래 키 추가
            for (const [tableName, constraints] of Object.entries(this.tableConstraints)) {
                const table = await queryRunner.getTable(tableName);
                const existingForeignKeys = table.foreignKeys.map(fk => fk.name);

                // 각 제약조건 처리
                for (const constraint of constraints) {
                    if (!existingForeignKeys.includes(constraint.name)) {
                        // 참조되는 컬럼이 NOT NULL인지 확인
                        const columnInfo = await queryRunner.query(`
                            SELECT IS_NULLABLE 
                            FROM information_schema.COLUMNS 
                            WHERE TABLE_SCHEMA = DATABASE()
                            AND TABLE_NAME = '${tableName}' 
                            AND COLUMN_NAME = '${constraint.column}'
                        `);

                        // NOT NULL이 아닌 경우 경고
                        if (columnInfo[0]?.IS_NULLABLE === 'YES') {
                            console.warn(`Warning: Column ${tableName}.${constraint.column} is nullable. Consider adding NOT NULL constraint.`);
                        }

                        // 외래 키 추가
                        await queryRunner.query(`
                            ALTER TABLE ${tableName}
                            ADD CONSTRAINT ${constraint.name}
                            FOREIGN KEY (${constraint.column})
                            REFERENCES ${constraint.referencedTable}(${constraint.referencedColumn})
                        `);

                        console.log(`Added foreign key ${constraint.name} to ${tableName}.${constraint.column}`);
                    } else {
                        console.log(`Foreign key ${constraint.name} already exists on ${tableName}.${constraint.column}`);
                    }
                }
            }

            console.log('Foreign key constraints added successfully!');

        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // 이 마이그레이션에서 추가된 외래 키만 제거
            for (const [tableName, constraints] of Object.entries(this.tableConstraints)) {
                if (await queryRunner.hasTable(tableName)) {
                    const table = await queryRunner.getTable(tableName);
                    const existingForeignKeys = table.foreignKeys;

                    for (const constraint of constraints) {
                        const fk = existingForeignKeys.find(fk => fk.name === constraint.name);
                        if (fk) {
                            await queryRunner.query(`
                                ALTER TABLE ${tableName}
                                DROP FOREIGN KEY ${constraint.name}
                            `);
                            console.log(`Removed foreign key ${constraint.name} from ${tableName}`);
                        }
                    }
                }
            }

            console.log('Foreign key constraints removed successfully!');

        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }
}