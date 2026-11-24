import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUsersPasswordHashConstraint1740820000000 implements MigrationInterface {
  name = 'FixUsersPasswordHashConstraint1740820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_password_hash";
      ALTER TABLE "users"
        ADD CONSTRAINT "chk_users_password_hash"
        CHECK ("status"::text IN ('invited', 'inactive') OR "password_hash" IS NOT NULL);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_password_hash";
      ALTER TABLE "users"
        ADD CONSTRAINT "chk_users_password_hash"
        CHECK ("status"::text = 'invited' OR "password_hash" IS NOT NULL);
    `);
  }
}
