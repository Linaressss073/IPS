import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SyncStaffFromProvider } from '../contexts/staff/application/commands/sync-staff-from-provider.command.js';

/**
 * Loads every current Clerk user and membership into the staff directory:
 * `pnpm staff:sync` (after `pnpm build`). Idempotent; webhooks keep it up
 * to date afterwards.
 */
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});
try {
  const { applied } = await app.get(SyncStaffFromProvider).execute();
  console.log(`Staff directory synced: ${applied} changes applied`);
} finally {
  await app.close();
}
