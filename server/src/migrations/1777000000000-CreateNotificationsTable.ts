import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateNotificationsTable1777000000000 implements MigrationInterface {
  name = 'CreateNotificationsTable1777000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "recipient_id" uuid NOT NULL,
        "activity_log_id" uuid,
        "type" character varying(100) NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "target_url" character varying(500),
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_recipient_id" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_notifications_activity_log_id" FOREIGN KEY ("activity_log_id") REFERENCES "activity_logs"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query('CREATE INDEX "IDX_notifications_recipient_read_created" ON "notifications" ("recipient_id", "read_at", "created_at")')
    await queryRunner.query('CREATE INDEX "IDX_notifications_activity_log_id" ON "notifications" ("activity_log_id")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_notifications_activity_log_id"')
    await queryRunner.query('DROP INDEX "IDX_notifications_recipient_read_created"')
    await queryRunner.query('DROP TABLE "notifications"')
  }
}
