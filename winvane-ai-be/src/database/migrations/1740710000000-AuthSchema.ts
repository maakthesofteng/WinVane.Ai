import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthSchema1740710000000 implements MigrationInterface {
  name = 'AuthSchema1740710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      CREATE TYPE "workspace_status_enum" AS ENUM ('pending_verification', 'active', 'suspended');
      CREATE TYPE "workspace_verification_method_enum" AS ENUM ('email_domain', 'dns_txt');
      CREATE TYPE "plan_tier_enum" AS ENUM ('free', 'pilot', 'pro');
      CREATE TYPE "user_status_enum" AS ENUM ('pending', 'active', 'suspended');
      CREATE TYPE "session_portal_enum" AS ENUM ('tenant', 'admin');
      CREATE TYPE "session_revoked_reason_enum" AS ENUM (
        'logout', 'revoked_by_user', 'password_reset', 'password_changed',
        'admin_action', 'superadmin_reset', 'idle_timeout', 'mfa_reset'
      );
      CREATE TYPE "audit_result_enum" AS ENUM ('success', 'failure', 'denied');
    `);

    // 2. Roles, Permissions, RolePermissions
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(50) NOT NULL UNIQUE,
        "is_platform_role" boolean NOT NULL DEFAULT false,
        "description" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar(100) NOT NULL UNIQUE,
        "description" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("role_id", "permission_id")
      );
    `);

    // 3. Workspaces & Users
    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "domain" varchar(253) NOT NULL,
        "status" "workspace_status_enum" NOT NULL DEFAULT 'pending_verification',
        "verification_method" "workspace_verification_method_enum" NOT NULL DEFAULT 'email_domain',
        "plan_tier" "plan_tier_enum" NOT NULL DEFAULT 'pilot',
        "owner_user_id" uuid NULL,
        "verified_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX "idx_workspaces_domain" ON "workspaces" (LOWER("domain"));

      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(254) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(120) NOT NULL,
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE RESTRICT,
        "workspace_id" uuid NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "status" "user_status_enum" NOT NULL DEFAULT 'pending',
        "email_verified_at" timestamptz NULL,
        "mfa_enabled" boolean NOT NULL DEFAULT false,
        "failed_login_attempts" int NOT NULL DEFAULT 0,
        "locked_until" timestamptz NULL,
        "last_login_at" timestamptz NULL,
        "password_changed_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX "idx_users_email" ON "users" (LOWER("email"));
      CREATE INDEX "idx_users_role_id" ON "users" ("role_id");
      CREATE INDEX "idx_users_workspace_id" ON "users" ("workspace_id");

      ALTER TABLE "workspaces"
        ADD CONSTRAINT "fk_workspaces_owner_user"
        FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
    `);

    // 4. Auth & Session tables
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "portal" "session_portal_enum" NOT NULL,
        "jti_hash" char(64) NOT NULL,
        "ip_address" varchar(45) NOT NULL,
        "user_agent" varchar(512) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "last_seen_at" timestamptz NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz NULL,
        "revoked_reason" "session_revoked_reason_enum" NULL
      );
      CREATE INDEX "idx_sessions_user_revoked" ON "sessions" ("user_id", "revoked_at");
      CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at");

      CREATE TABLE "domain_verification_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "email" varchar(254) NOT NULL,
        "token_hash" char(64) NOT NULL UNIQUE,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_dvt_workspace_id" ON "domain_verification_tokens" ("workspace_id");
      CREATE INDEX "idx_dvt_user_id" ON "domain_verification_tokens" ("user_id");

      CREATE TABLE "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" char(64) NOT NULL UNIQUE,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz NULL,
        "requested_ip" varchar(45) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_prt_user_id" ON "password_reset_tokens" ("user_id");

      CREATE TABLE "mfa_devices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "secret_encrypted" text NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "confirmed_at" timestamptz NULL,
        "last_used_step" bigint NULL,
        "backup_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 5. Audit Log table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "workspace_id" uuid NULL,
        "action" varchar(100) NOT NULL,
        "result" "audit_result_enum" NOT NULL,
        "target_type" varchar(50) NULL,
        "target_id" varchar(64) NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "ip_address" varchar(45) NULL,
        "user_agent" varchar(512) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_audit_logs_workspace_created" ON "audit_logs" ("workspace_id", "created_at" DESC);
      CREATE INDEX "idx_audit_logs_actor_created" ON "audit_logs" ("actor_user_id", "created_at" DESC);
      CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mfa_devices" CASCADE;`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "domain_verification_tokens" CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE;`);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "workspaces" DROP CONSTRAINT IF EXISTS "fk_workspaces_owner_user";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspaces" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE;`);

    await queryRunner.query(`DROP TYPE IF EXISTS "audit_result_enum";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "session_revoked_reason_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "session_portal_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_tier_enum";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "workspace_verification_method_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "workspace_status_enum";`);
  }
}
