import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateNotificationTable1727956898358 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "notification",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "user_id",
                    type: "int",
                },
                {
                    name: "type",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "message",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "is_read",
                    type: "boolean",
                    default: false
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "deleted_at",
                    type: "timestamp",
                    isNullable: true
                }
            ]
        }), true);

        await queryRunner.createForeignKey("notification", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["user_id"],
            referencedTableName: "user_account",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("notification");
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("user_id") !== -1);
        await queryRunner.dropForeignKey("notification", foreignKey);
        await queryRunner.dropTable("notification");
    }

}
