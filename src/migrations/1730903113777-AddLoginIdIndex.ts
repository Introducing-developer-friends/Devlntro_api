import { MigrationInterface, QueryRunner, TableIndex, Table } from "typeorm";

export class AddLoginIdIndex1730903113777 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const userTable = await queryRunner.getTable("user_account");
        
        // 1. user_account 테이블의 login_id 유니크 인덱스 추가
        const existingUniqueIndex = userTable?.indices.find(
            index => index.name === "IDX_3be8d6d99d1cfeb79ef24b7710"
        );

        // 유니크 인덱스가 이미 존재하지 않는 경우에만 생성
        if (!existingUniqueIndex) {
            await queryRunner.createIndex('user_account', new TableIndex({
                name: "IDX_3be8d6d99d1cfeb79ef24b7710",
                columnNames: ['login_id'],
                isUnique: true
            }));
        }

        // 2. user_account 테이블의 login_id 일반 인덱스 추가
        const existingNormalIndex = userTable?.indices.find(
            index => index.name === "idx_login_id"
        );

        // 일반 인덱스가 이미 존재하지 않는 경우에만 생성
        if (!existingNormalIndex) {
            await queryRunner.createIndex('user_account', new TableIndex({
                name: "idx_login_id",
                columnNames: ['login_id']
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const userTable = await queryRunner.getTable("user_account");

        // 1. 유니크 인덱스 삭제
        if (userTable?.indices.find(index => index.name === "IDX_3be8d6d99d1cfeb79ef24b7710")) {
            await queryRunner.dropIndex('user_account', "IDX_3be8d6d99d1cfeb79ef24b7710");
        }

        // 2. 일반 인덱스 삭제
        if (userTable?.indices.find(index => index.name === "idx_login_id")) {
            await queryRunner.dropIndex('user_account', "idx_login_id");
        }
    }
}