import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateFriendRequestTable1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 테이블이 이미 존재하는지 확인
        const tableExists = await queryRunner.hasTable("friend_request");
        if (!tableExists) {
            await queryRunner.createTable(new Table({
                name: "friend_request",
                columns: [
                    {
                        name: "request_id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "sender_id",
                        type: "int"
                    },
                    {
                        name: "receiver_id",
                        type: "int"
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["pending", "accepted", "rejected"],
                        default: "'pending'"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            }), true);
        }

        // 테이블 가져오기
        const table = await queryRunner.getTable("friend_request");
        
        // sender_id 외래 키 확인 및 생성
        const senderFKExists = table.foreignKeys.some(fk => fk.columnNames.includes("sender_id"));
        if (!senderFKExists) {
            await queryRunner.createForeignKey("friend_request", new TableForeignKey({
                name: "FK_friend_request_sender",
                columnNames: ["sender_id"],
                referencedColumnNames: ["user_id"],
                referencedTableName: "user_account",
                onDelete: "CASCADE"
            }));
        }

        // receiver_id 외래 키 확인 및 생성
        const receiverFKExists = table.foreignKeys.some(fk => fk.columnNames.includes("receiver_id"));
        if (!receiverFKExists) {
            await queryRunner.createForeignKey("friend_request", new TableForeignKey({
                name: "FK_friend_request_receiver",
                columnNames: ["receiver_id"],
                referencedColumnNames: ["user_id"],
                referencedTableName: "user_account",
                onDelete: "CASCADE"
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("friend_request");
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("friend_request", foreignKey);
            }
            await queryRunner.dropTable("friend_request");
        }
    }
}