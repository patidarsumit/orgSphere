import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddHrAndViewerRoles1776700000000 implements MigrationInterface {
  name = 'AddHrAndViewerRoles1776700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'hr'`
    )
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'viewer'`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "users" SET "role" = 'employee' WHERE "role" IN ('hr', 'viewer')`)
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'manager', 'tech_lead', 'employee')`
    )
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`)
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::text::"public"."users_role_enum"`
    )
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'employee'`)
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`)
  }
}
