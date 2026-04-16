import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTeamsTable1776300000000 implements MigrationInterface {
  name = 'CreateTeamsTable1776300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teams_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_teams_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "team_members" (
        "team_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_team_members" PRIMARY KEY ("team_id", "user_id"),
        CONSTRAINT "FK_team_members_team_id" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_team_members_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    await queryRunner.query('CREATE INDEX "IDX_team_members_team_id" ON "team_members" ("team_id")')
    await queryRunner.query('CREATE INDEX "IDX_team_members_user_id" ON "team_members" ("user_id")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_team_members_user_id"')
    await queryRunner.query('DROP INDEX "IDX_team_members_team_id"')
    await queryRunner.query('DROP TABLE "team_members"')
    await queryRunner.query('DROP TABLE "teams"')
  }
}
