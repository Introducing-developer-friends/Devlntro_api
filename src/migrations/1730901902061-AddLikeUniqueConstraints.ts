import { MigrationInterface, QueryRunner, TableIndex, Table } from "typeorm";

export class AddLikeUniqueConstraints1730901902061 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // 1. post_like 테이블의 post_id, user_id에 대한 유니크 인덱스 추가
        const postLikeTable = await queryRunner.getTable("post_like");
        const existingPostLikeIndex = postLikeTable?.indices.find(
            index => index.name === "IDX_155b6bea641466e2d27ade96a4"
        );

        // 인덱스가 이미 존재하지 않는 경우에만 생성
        if (!existingPostLikeIndex) {
            await queryRunner.createIndex('post_like', new TableIndex({
                name: "IDX_155b6bea641466e2d27ade96a4",
                columnNames: ['post_id', 'user_id'],
                isUnique: true
            }));
        }

        // 2. comment_like 테이블의 comment_id, user_id에 대한 유니크 인덱스 추가
        const commentLikeTable = await queryRunner.getTable("comment_like");
        const existingCommentLikeIndex = commentLikeTable?.indices.find(
            index => index.name === "IDX_b81e662a725f9440050ac6e4e2"
        );

        // 인덱스가 이미 존재하지 않는 경우에만 생성
        if (!existingCommentLikeIndex) {
            await queryRunner.createIndex('comment_like', new TableIndex({
                name: "IDX_b81e662a725f9440050ac6e4e2",
                columnNames: ['comment_id', 'user_id'],
                isUnique: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // 1. post_like 테이블의 유니크 인덱스 삭제
        const postLikeTable = await queryRunner.getTable("post_like");
        const commentLikeTable = await queryRunner.getTable("comment_like");

        // 2. comment_like 테이블의 유니크 인덱스 삭제
        if (postLikeTable?.indices.find(index => index.name === "IDX_155b6bea641466e2d27ade96a4")) {
            await queryRunner.dropIndex('post_like', "IDX_155b6bea641466e2d27ade96a4");
        }

        if (commentLikeTable?.indices.find(index => index.name === "IDX_b81e662a725f9440050ac6e4e2")) {
            await queryRunner.dropIndex('comment_like', "IDX_b81e662a725f9440050ac6e4e2");
        }
    }
}