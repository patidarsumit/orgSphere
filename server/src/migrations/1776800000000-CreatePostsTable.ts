import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePostsTable1776800000000 implements MigrationInterface {
  name = 'CreatePostsTable1776800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."posts_status_enum" AS ENUM('draft', 'published', 'archived')
    `)
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "subtitle" character varying(500),
        "slug" character varying(300) NOT NULL,
        "content" jsonb NOT NULL DEFAULT '{}',
        "cover_image_url" character varying(500),
        "tags" jsonb NOT NULL DEFAULT '[]',
        "status" "public"."posts_status_enum" NOT NULL DEFAULT 'draft',
        "reading_time" integer NOT NULL DEFAULT 1,
        "views" integer NOT NULL DEFAULT 0,
        "author_id" uuid,
        "published_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_posts_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_posts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "IDX_posts_status_published_at" ON "posts" ("status", "published_at")')
    await queryRunner.query('CREATE INDEX "IDX_posts_author_id" ON "posts" ("author_id")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_posts_author_id"')
    await queryRunner.query('DROP INDEX "IDX_posts_status_published_at"')
    await queryRunner.query('DROP TABLE "posts"')
    await queryRunner.query('DROP TYPE "public"."posts_status_enum"')
  }
}
