import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDeletedAtToUserAccount1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('user_account', 'deletedAt');
    if (!hasColumn) {
      await queryRunner.addColumn('user_account', new TableColumn({
        name: 'deletedAt',
        type: 'timestamp',
        isNullable: true,
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('user_account', 'deletedAt');
    if (hasColumn) {
      await queryRunner.dropColumn('user_account', 'deletedAt');
    }
  }
}