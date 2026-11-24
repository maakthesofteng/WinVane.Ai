import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableExtensions1740700000000 implements MigrationInterface {
  name = 'EnableExtensions1740700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
          CREATE EXTENSION IF NOT EXISTS "vector";
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP EXTENSION IF EXISTS "vector";');
    await queryRunner.query('DROP EXTENSION IF EXISTS "pgcrypto";');
  }
}
