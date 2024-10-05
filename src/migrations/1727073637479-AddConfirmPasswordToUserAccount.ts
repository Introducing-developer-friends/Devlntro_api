import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddConfirmPasswordToUserAccount1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('user_account', 'confirm_password');
        if (!hasColumn) {
            // 먼저 NULL을 허용하는 컬럼 추가
            await queryRunner.addColumn('user_account', new TableColumn({
                name: 'confirm_password',
                type: 'varchar',
                length: '255',
                isNullable: true
            }));

            // 기존 password 값을 confirm_password에 복사
            await queryRunner.query(`
                UPDATE user_account
                SET confirm_password = password
            `);

            // NOT NULL 제약 조건 추가
            await queryRunner.changeColumn('user_account', 'confirm_password', new TableColumn({
                name: 'confirm_password',
                type: 'varchar',
                length: '255',
                isNullable: false
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('user_account', 'confirm_password');
        if (hasColumn) {
            await queryRunner.dropColumn('user_account', 'confirm_password');
        }
    }
}