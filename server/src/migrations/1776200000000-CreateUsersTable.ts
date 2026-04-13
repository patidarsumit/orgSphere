import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUsersTable1776200000000 implements MigrationInterface {
  name = 'CreateUsersTable1776200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    await queryRunner.query(
      "CREATE TYPE \"public\".\"users_role_enum\" AS ENUM('admin', 'manager', 'tech_lead', 'employee')"
    )
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'employee',
        "department" character varying(255),
        "skills" jsonb NOT NULL DEFAULT '[]',
        "avatar_path" character varying(500),
        "manager_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_manager_id" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users"')
    await queryRunner.query('DROP TYPE "public"."users_role_enum"')
  }
}

