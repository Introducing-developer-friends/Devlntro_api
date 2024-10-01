// src/migrations/[timestamp]-CreateFriendRequestTable.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateFriendRequestTable1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "friend_request",
            columns: [
                {
                    name: "request_id",
                    type: "int",
                    isPrimary: true, // 기본 키로 설정
                    isGenerated: true, // 자동 생성되도록 설정
                    generationStrategy: "increment" // 자동 증가 전략 사용
                },
                {
                    name: "sender_id", // 요청을 보낸 사용자의 ID
                    type: "int"
                },
                {
                    name: "receiver_id", // 요청을 받은 사용자의 ID
                    type: "int"
                },
                {
                    name: "status", // 요청 상태 (pending, accepted, rejected)
                    type: "enum", 
                    enum: ["pending", "accepted", "rejected"],
                    default: "'pending'"
                },
                {
                    name: "created_at", // 요청 생성 시각
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP" // 기본값을 현재 시각으로 설정
                }
            ]
        }), true);

        // sender_id 컬럼에 대한 외래 키를 생성하고 user_account 테이블의 user_id와 연관시킵니다.
        await queryRunner.createForeignKey("friend_request", new TableForeignKey({
            columnNames: ["sender_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account",
            onDelete: "CASCADE"
        }));

        // receiver_id 컬럼에 대한 외래 키를 생성하고 user_account 테이블의 user_id와 연관시킵니다.
        await queryRunner.createForeignKey("friend_request", new TableForeignKey({
            columnNames: ["receiver_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account",
            onDelete: "CASCADE"
        }));
    }

    // down 메서드는 마이그레이션이 롤백될 때 수행되는 작업을 정의합니다.
    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("friend_request");
        const foreignKeys = table.foreignKeys;
        await queryRunner.dropForeignKeys("friend_request", foreignKeys);
        await queryRunner.dropTable("friend_request");
    }
}