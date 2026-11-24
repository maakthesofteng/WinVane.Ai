import appDataSource from '../dataSource';
import { seedRoles } from './seedRoles';
import { seedSuperadmin } from './seedSuperadmin';

export async function runAllSeeds(): Promise<void> {
  const initialized = appDataSource.isInitialized;
  if (!initialized) {
    await appDataSource.initialize();
  }

  try {
    process.stdout.write('[Seed] Starting database seeds...\n');
    await seedRoles();
    await seedSuperadmin();
    process.stdout.write('[Seed] All database seeds completed successfully.\n');
  } finally {
    if (!initialized && appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

if (require.main === module) {
  runAllSeeds()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[Seed Error] ${msg}\n`);
      process.exit(1);
    });
}
