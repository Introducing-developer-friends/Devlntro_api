import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddPostIdAndCommentIdToNotification1727956898359 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // postId 컬럼 추가
        await queryRunner.addColumn('notification', new TableColumn({
            name: 'postId',
            type: 'int',
            isNullable: true,
        }));

        // commentId 컬럼 추가
        await queryRunner.addColumn('notification', new TableColumn({
            name: 'commentId',
            type: 'int',
            isNullable: true,
        }));

        // postId 외래 키 추가
        await queryRunner.createForeignKey('notification', new TableForeignKey({
            columnNames: ['postId'],
            referencedColumnNames: ['post_id'],
            referencedTableName: 'post',
            onDelete: 'CASCADE',
        }));

        // commentId 외래 키 추가
        await queryRunner.createForeignKey('notification', new TableForeignKey({
            columnNames: ['commentId'],
            referencedColumnNames: ['comment_id'],
            referencedTableName: 'comment',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 외래 키 삭제
        await queryRunner.dropForeignKey('notification', 'FK_notification_post');
        await queryRunner.dropForeignKey('notification', 'FK_notification_comment');

        // 컬럼 삭제
        await queryRunner.dropColumn('notification', 'postId');
        await queryRunner.dropColumn('notification', 'commentId');
    }
}
