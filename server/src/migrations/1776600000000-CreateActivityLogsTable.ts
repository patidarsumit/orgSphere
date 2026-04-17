import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateActivityLogsTable1776600000000 implements MigrationInterface {
  name = 'CreateActivityLogsTable1776600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "action" character varying(100) NOT NULL,
        "entity_type" character varying(100) NOT NULL,
        "entity_id" uuid NOT NULL,
        "entity_name" character varying(255),
        "actor_id" uuid,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "read_by" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_activity_logs_actor_id" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "IDX_activity_logs_entity" ON "activity_logs" ("entity_type", "entity_id")')
    await queryRunner.query('CREATE INDEX "IDX_activity_logs_actor_id" ON "activity_logs" ("actor_id")')
    await queryRunner.query('CREATE INDEX "IDX_activity_logs_created_at" ON "activity_logs" ("created_at")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_activity_logs_created_at"')
    await queryRunner.query('DROP INDEX "IDX_activity_logs_actor_id"')
    await queryRunner.query('DROP INDEX "IDX_activity_logs_entity"')
    await queryRunner.query('DROP TABLE "activity_logs"')
  }
}
