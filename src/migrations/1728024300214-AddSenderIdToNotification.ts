import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSenderIdToNotification1728024300214 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('notification', 'sender_id');
        if (!hasColumn) {
            await queryRunner.addColumn('notification', new TableColumn({
                name: 'sender_id',
                type: 'int',
                isNullable: true
            }));

            await queryRunner.query(`UPDATE notification SET sender_id = 0 WHERE sender_id IS NULL`);

            await queryRunner.changeColumn('notification', 'sender_id', new TableColumn({
                name: 'sender_id',
                type: 'int',
                isNullable: false
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('notification', 'sender_id');
        if (hasColumn) {
            await queryRunner.dropColumn('notification', 'sender_id');
        }
    }
}