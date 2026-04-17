import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTasksAndNotesTable1776500000000 implements MigrationInterface {
  name = 'CreateTasksAndNotesTable1776500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "task_status_enum" AS ENUM ('todo', 'in_progress', 'review', 'done')
    `)
    await queryRunner.query(`
      CREATE TYPE "task_priority_enum" AS ENUM ('low', 'medium', 'high')
    `)
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" "task_status_enum" NOT NULL DEFAULT 'todo',
        "priority" "task_priority_enum" NOT NULL DEFAULT 'medium',
        "due_date" date,
        "assigned_to" uuid NOT NULL,
        "project_id" uuid,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_assigned_to" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_tasks_project_id" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tasks_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "content" jsonb NOT NULL DEFAULT '{}',
        "tags" jsonb NOT NULL DEFAULT '[]',
        "user_id" uuid NOT NULL,
        "project_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notes_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_notes_project_id" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `)

    await queryRunner.query('CREATE INDEX "IDX_tasks_assigned_to" ON "tasks" ("assigned_to")')
    await queryRunner.query('CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")')
    await queryRunner.query('CREATE INDEX "IDX_tasks_project_id" ON "tasks" ("project_id")')
    await queryRunner.query('CREATE INDEX "IDX_notes_user_id" ON "notes" ("user_id")')
    await queryRunner.query('CREATE INDEX "IDX_notes_project_id" ON "notes" ("project_id")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_notes_project_id"')
    await queryRunner.query('DROP INDEX "IDX_notes_user_id"')
    await queryRunner.query('DROP INDEX "IDX_tasks_project_id"')
    await queryRunner.query('DROP INDEX "IDX_tasks_status"')
    await queryRunner.query('DROP INDEX "IDX_tasks_assigned_to"')
    await queryRunner.query('DROP TABLE "notes"')
    await queryRunner.query('DROP TABLE "tasks"')
    await queryRunner.query('DROP TYPE "task_priority_enum"')
    await queryRunner.query('DROP TYPE "task_status_enum"')
  }
}
