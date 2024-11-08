import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddUserLoginIdIndexAndUniqueConstraint1730973620802 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // UserAccount 테이블의 인덱스 확인 및 생성
        const userTable = await queryRunner.getTable("user_account");

        const existingIndex = userTable?.indices.find(
            index => index.name === "IDX_user_login_id"
        );

        // login_id 컬럼에 대한 일반 인덱스가 존재하지 않는 경우 생성
        if (!existingIndex) {
            await queryRunner.createIndex('user_account', new TableIndex({
                name: "IDX_user_login_id",
                columnNames: ['login_id']
            }));
        }

        // UserAccount 테이블의 유니크 제약 조건 확인 및 생성
        const existingUniqueConstraint = userTable?.uniques.find(
            unique => unique.name === "UQ_user_login_id"
        );

        // login_id 컬럼에 대한 유니크 제약 조건이 존재하지 않는 경우 생성
        if (!existingUniqueConstraint) {
            await queryRunner.query(`
                ALTER TABLE user_account
                ADD CONSTRAINT UQ_user_login_id UNIQUE (login_id)
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // UserAccount 테이블의 인덱스 및 유니크 제약 조건 삭제
        const userTable = await queryRunner.getTable("user_account");

        // login_id 컬럼에 대한 일반 인덱스가 존재하는 경우 삭제
        if (userTable?.indices.find(index => index.name === "IDX_user_login_id")) {
            await queryRunner.dropIndex('user_account', "IDX_user_login_id");
        }

        // login_id 컬럼에 대한 유니크 제약 조건이 존재하는 경우 삭제
        if (userTable?.uniques.find(unique => unique.name === "UQ_user_login_id")) {
            await queryRunner.query(`
                ALTER TABLE user_account
                DROP CONSTRAINT UQ_user_login_id
            `);
        }
    }
}
