import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateProjectsTables1776400000000 implements MigrationInterface {
  name = 'CreateProjectsTables1776400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "project_status_enum" AS ENUM ('active', 'completed', 'on_hold', 'planned', 'archived')
    `)

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" "project_status_enum" NOT NULL DEFAULT 'active',
        "tech_stack" jsonb NOT NULL DEFAULT '[]',
        "start_date" date,
        "manager_id" uuid,
        "tech_lead_id" uuid,
        "team_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_manager_id" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_projects_tech_lead_id" FOREIGN KEY ("tech_lead_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_projects_team_id" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "project_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying(100) NOT NULL DEFAULT 'Member',
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_members_project_user" UNIQUE ("project_id", "user_id"),
        CONSTRAINT "FK_project_members_project_id" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_project_members_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    await queryRunner.query('CREATE INDEX "IDX_projects_status" ON "projects" ("status")')
    await queryRunner.query('CREATE INDEX "IDX_projects_team_id" ON "projects" ("team_id")')
    await queryRunner.query('CREATE INDEX "IDX_projects_manager_id" ON "projects" ("manager_id")')
    await queryRunner.query('CREATE INDEX "IDX_project_members_project_id" ON "project_members" ("project_id")')
    await queryRunner.query('CREATE INDEX "IDX_project_members_user_id" ON "project_members" ("user_id")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_project_members_user_id"')
    await queryRunner.query('DROP INDEX "IDX_project_members_project_id"')
    await queryRunner.query('DROP INDEX "IDX_projects_manager_id"')
    await queryRunner.query('DROP INDEX "IDX_projects_team_id"')
    await queryRunner.query('DROP INDEX "IDX_projects_status"')
    await queryRunner.query('DROP TABLE "project_members"')
    await queryRunner.query('DROP TABLE "projects"')
    await queryRunner.query('DROP TYPE "project_status_enum"')
  }
}
