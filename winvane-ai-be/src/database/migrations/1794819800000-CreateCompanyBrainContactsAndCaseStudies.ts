import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyBrainContactsAndCaseStudies1794819800000
  implements MigrationInterface
{
  name = 'CreateCompanyBrainContactsAndCaseStudies1794819800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_brain_contacts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_brain_id" uuid NOT NULL REFERENCES "company_brains"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "work_email" varchar(254) NOT NULL,
        "contact_number" varchar(32) NOT NULL DEFAULT '',
        "job_title" varchar(120) NOT NULL DEFAULT '',
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_company_brain_contacts_profile_order"
        ON "company_brain_contacts" ("company_brain_id", "sort_order");
      CREATE UNIQUE INDEX "idx_company_brain_contacts_profile_email"
        ON "company_brain_contacts" ("company_brain_id", LOWER("work_email"));

      CREATE TABLE "company_brain_case_studies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_brain_id" uuid NOT NULL REFERENCES "company_brains"("id") ON DELETE CASCADE,
        "title" varchar(200) NOT NULL,
        "client_name" varchar(160) NOT NULL DEFAULT '',
        "industry" varchar(120) NOT NULL DEFAULT '',
        "content" jsonb NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_company_brain_case_studies_profile_order"
        ON "company_brain_case_studies" ("company_brain_id", "sort_order");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "company_brain_case_studies";
      DROP TABLE IF EXISTS "company_brain_contacts";
    `);
  }
}
