import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSenderIdToNotification1728024300214 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 먼저 NULL을 허용하는 컬럼을 추가합니다.
        await queryRunner.query(`ALTER TABLE \`notification\` ADD \`sender_id\` INT`);
        
        // 기존 레코드에 대해 임시 값을 설정합니다. (예: 0)
        await queryRunner.query(`UPDATE \`notification\` SET \`sender_id\` = 0 WHERE \`sender_id\` IS NULL`);
        
        // 그 다음 NOT NULL 제약조건을 추가합니다.
        await queryRunner.query(`ALTER TABLE \`notification\` MODIFY \`sender_id\` INT NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notification\` DROP COLUMN \`sender_id\``);
    }

}
