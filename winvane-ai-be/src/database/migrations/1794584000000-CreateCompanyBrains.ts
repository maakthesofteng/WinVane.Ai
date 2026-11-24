import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyBrains1794584000000 implements MigrationInterface {
  name = 'CreateCompanyBrains1794584000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_brains" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspace_id" uuid NOT NULL UNIQUE REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "tech_stacks" text[] NOT NULL DEFAULT '{}',
        "industries" text[] NOT NULL DEFAULT '{}',
        "services" text[] NOT NULL DEFAULT '{}',
        "target_regions" text[] NOT NULL DEFAULT '{}',
        "company_size_band" varchar(80) NOT NULL DEFAULT '',
        "pricing_range" varchar(120) NOT NULL DEFAULT '',
        "pricing_model" varchar(80) NOT NULL DEFAULT '',
        "summary" varchar(2000) NOT NULL DEFAULT '',
        "website_url" varchar(2048) NOT NULL DEFAULT '',
        "status" varchar(16) NOT NULL DEFAULT 'draft',
        "version" integer NOT NULL DEFAULT 1,
        "created_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "updated_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_company_brains_status" CHECK ("status" IN ('draft', 'confirmed')),
        CONSTRAINT "chk_company_brains_version" CHECK ("version" > 0)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "company_brains";');
  }
}
