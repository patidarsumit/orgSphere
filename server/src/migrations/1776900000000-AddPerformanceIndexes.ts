import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPerformanceIndexes1776900000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1776900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_users_manager_id" ON "users" ("manager_id")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_users_role_active" ON "users" ("role", "is_active")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_users_department_active" ON "users" ("department", "is_active")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_users_name_trgm" ON "users" USING gin ("name" gin_trgm_ops)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_users_email_trgm" ON "users" USING gin ("email" gin_trgm_ops)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_users_skills_gin" ON "users" USING gin ("skills")')

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_teams_created_by" ON "teams" ("created_by")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_teams_created_at" ON "teams" ("created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_teams_name_trgm" ON "teams" USING gin ("name" gin_trgm_ops)')

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_projects_tech_lead_id" ON "projects" ("tech_lead_id")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_projects_created_at" ON "projects" ("created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_projects_status_created_at" ON "projects" ("status", "created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_projects_name_trgm" ON "projects" USING gin ("name" gin_trgm_ops)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_projects_tech_stack_gin" ON "projects" USING gin ("tech_stack")')

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_tasks_created_by" ON "tasks" ("created_by")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_tasks_priority" ON "tasks" ("priority")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_tasks_due_date" ON "tasks" ("due_date")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_tasks_created_at" ON "tasks" ("created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_tasks_assigned_status" ON "tasks" ("assigned_to", "status")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_tasks_project_status" ON "tasks" ("project_id", "status")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_tasks_assigned_due_status" ON "tasks" ("assigned_to", "due_date", "status")')

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_notes_user_created_at" ON "notes" ("user_id", "created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_notes_project_created_at" ON "notes" ("project_id", "created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_notes_tags_gin" ON "notes" USING gin ("tags")')

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_activity_logs_entity_created_at" ON "activity_logs" ("entity_type", "created_at")')

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_posts_status_created_at" ON "posts" ("status", "created_at")')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_posts_title_trgm" ON "posts" USING gin ("title" gin_trgm_ops)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_posts_tags_gin" ON "posts" USING gin ("tags")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_posts_tags_gin"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_posts_title_trgm"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_posts_status_created_at"')

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_activity_logs_entity_created_at"')

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notes_tags_gin"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notes_project_created_at"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notes_user_created_at"')

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_assigned_due_status"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_project_status"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_assigned_status"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_created_at"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_due_date"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_priority"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_created_by"')

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_projects_tech_stack_gin"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_projects_name_trgm"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_projects_status_created_at"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_projects_created_at"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_projects_tech_lead_id"')

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_teams_name_trgm"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_teams_created_at"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_teams_created_by"')

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_skills_gin"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_email_trgm"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_name_trgm"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_created_at"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_department_active"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_role_active"')
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_manager_id"')
  }
}
