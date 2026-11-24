import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeamsAndWorkspaceRoles1740800000000 implements MigrationInterface {
  name = 'TeamsAndWorkspaceRoles1740800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      CREATE TYPE "role_system_key_enum" AS ENUM ('super_admin', 'owner', 'admin', 'manager', 'member');
      CREATE TYPE "invitation_status_enum" AS ENUM ('pending', 'accepted', 'revoked', 'expired');
      CREATE TYPE "team_role_enum" AS ENUM ('admin', 'manager', 'member');
      ALTER TYPE "user_status_enum" ADD VALUE IF NOT EXISTS 'invited';
      ALTER TYPE "user_status_enum" ADD VALUE IF NOT EXISTS 'inactive';
    `);

    // In PostgreSQL, new enum values added via ALTER TYPE ... ADD VALUE must be committed
    // before they can be used in subsequent DDL expressions (e.g. CHECK constraints).
    if (queryRunner.isTransactionActive) {
      await queryRunner.commitTransaction();
      await queryRunner.startTransaction();
    }

    // 2. Roles modifications
    await queryRunner.query(`
      ALTER TABLE "roles"
        ADD COLUMN "workspace_id" uuid NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
        ADD COLUMN "system_key" "role_system_key_enum" NULL,
        ADD COLUMN "is_system" boolean NOT NULL DEFAULT false,
        ADD COLUMN "created_by_id" uuid NULL,
        ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

      ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_name_key";

      CREATE UNIQUE INDEX "idx_roles_global_name" ON "roles" (LOWER("name")) WHERE "workspace_id" IS NULL;
      CREATE UNIQUE INDEX "idx_roles_workspace_name" ON "roles" ("workspace_id", LOWER("name")) WHERE "workspace_id" IS NOT NULL;
      CREATE UNIQUE INDEX "idx_roles_workspace_system_key" ON "roles" ("workspace_id", "system_key") WHERE "system_key" IS NOT NULL;
      CREATE UNIQUE INDEX "idx_roles_global_system_key" ON "roles" ("system_key") WHERE "workspace_id" IS NULL AND "system_key" IS NOT NULL;
    `);

    // 3. Permissions catalog metadata
    await queryRunner.query(`
      ALTER TABLE "permissions"
        ADD COLUMN "module" varchar(50) NOT NULL DEFAULT '',
        ADD COLUMN "module_label" varchar(80) NOT NULL DEFAULT '',
        ADD COLUMN "label" varchar(100) NOT NULL DEFAULT '',
        ADD COLUMN "sort_order" int NOT NULL DEFAULT 0,
        ADD COLUMN "module_sort_order" int NOT NULL DEFAULT 0,
        ADD COLUMN "is_platform" boolean NOT NULL DEFAULT false,
        ADD COLUMN "is_assignable" boolean NOT NULL DEFAULT true;
    `);

    // 4. Users modifications
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "password_hash" DROP NOT NULL,
        ADD COLUMN "phone" varchar(20) NULL,
        ADD COLUMN "job_title" varchar(100) NULL,
        ADD COLUMN "invited_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        ADD COLUMN "deactivated_at" timestamptz NULL,
        ADD COLUMN "deactivated_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL;

      ALTER TABLE "users"
        ADD CONSTRAINT "chk_users_password_hash"
        CHECK ("status"::text IN ('invited', 'inactive') OR "password_hash" IS NOT NULL);

      CREATE INDEX "idx_users_workspace_status" ON "users" ("workspace_id", "status");
      CREATE INDEX "idx_users_workspace_role" ON "users" ("workspace_id", "role_id");
      CREATE INDEX "idx_users_lower_full_name" ON "users" (LOWER("full_name"));

      ALTER TABLE "roles"
        ADD CONSTRAINT "fk_roles_created_by"
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL;
    `);

    // 5. Departments
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "name" varchar(80) NOT NULL,
        "created_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX "idx_departments_workspace_lower_name" ON "departments" ("workspace_id", LOWER("name"));
    `);

    // 6. Teams
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "name" varchar(80) NOT NULL,
        "description" varchar(500) NULL,
        "department_id" uuid NULL REFERENCES "departments"("id") ON DELETE SET NULL,
        "created_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "updated_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX "idx_teams_workspace_lower_name" ON "teams" ("workspace_id", LOWER("name"));
      CREATE INDEX "idx_teams_workspace_id" ON "teams" ("workspace_id");
    `);

    // 7. Team Memberships
    await queryRunner.query(`
      CREATE TABLE "team_memberships" (
        "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "team_role" "team_role_enum" NOT NULL,
        "added_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("team_id", "user_id")
      );
      CREATE UNIQUE INDEX "idx_team_memberships_single_admin" ON "team_memberships" ("team_id") WHERE "team_role" = 'admin';
      CREATE UNIQUE INDEX "idx_team_memberships_single_manager" ON "team_memberships" ("team_id") WHERE "team_role" = 'manager';
      CREATE INDEX "idx_team_memberships_user_id" ON "team_memberships" ("user_id");
    `);

    // 8. Invitations
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "email" varchar(254) NOT NULL,
        "token_hash" char(64) NOT NULL UNIQUE,
        "status" "invitation_status_enum" NOT NULL DEFAULT 'pending',
        "expires_at" timestamptz NOT NULL,
        "invited_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "accepted_at" timestamptz NULL,
        "revoked_at" timestamptz NULL,
        "revoked_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "last_sent_at" timestamptz NOT NULL DEFAULT now(),
        "send_count" int NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_invitations_workspace_id" ON "invitations" ("workspace_id");
      CREATE INDEX "idx_invitations_user_id" ON "invitations" ("user_id");
      CREATE UNIQUE INDEX "idx_invitations_pending_user" ON "invitations" ("user_id") WHERE "status" = 'pending';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "invitations" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "team_memberships" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "teams" CASCADE;');
    await queryRunner.query('DROP TABLE IF EXISTS "departments" CASCADE;');

    await queryRunner.query(`
      ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "fk_roles_created_by";
      DROP INDEX IF EXISTS "idx_users_lower_full_name";
      DROP INDEX IF EXISTS "idx_users_workspace_role";
      DROP INDEX IF EXISTS "idx_users_workspace_status";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_password_hash";
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "deactivated_by_id",
        DROP COLUMN IF EXISTS "deactivated_at",
        DROP COLUMN IF EXISTS "invited_by_id",
        DROP COLUMN IF EXISTS "job_title",
        DROP COLUMN IF EXISTS "phone",
        ALTER COLUMN "password_hash" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "permissions"
        DROP COLUMN IF EXISTS "is_assignable",
        DROP COLUMN IF EXISTS "is_platform",
        DROP COLUMN IF EXISTS "module_sort_order",
        DROP COLUMN IF EXISTS "sort_order",
        DROP COLUMN IF EXISTS "label",
        DROP COLUMN IF EXISTS "module_label",
        DROP COLUMN IF EXISTS "module";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_roles_global_system_key";
      DROP INDEX IF EXISTS "idx_roles_workspace_system_key";
      DROP INDEX IF EXISTS "idx_roles_workspace_name";
      DROP INDEX IF EXISTS "idx_roles_global_name";
      ALTER TABLE "roles"
        DROP COLUMN IF EXISTS "updated_at",
        DROP COLUMN IF EXISTS "created_by_id",
        DROP COLUMN IF EXISTS "is_system",
        DROP COLUMN IF EXISTS "system_key",
        DROP COLUMN IF EXISTS "workspace_id";
      ALTER TABLE "roles" ADD CONSTRAINT "roles_name_key" UNIQUE ("name");
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "team_role_enum";
      DROP TYPE IF EXISTS "invitation_status_enum";
      DROP TYPE IF EXISTS "role_system_key_enum";
    `);
  }
}
