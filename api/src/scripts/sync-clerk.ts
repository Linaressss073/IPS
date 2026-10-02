import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SyncOrganizationsFromProvider } from '../contexts/organizations/application/commands/sync-organizations-from-provider.command.js';
import { SyncStaffFromProvider } from '../contexts/staff/application/commands/sync-staff-from-provider.command.js';
import { STAFF_PROJECTION } from '../contexts/staff/application/constants/injection-tokens.js';
import type { StaffProjection } from '../contexts/staff/application/ports/staff-projection.port.js';

/**
 * Loads every current Clerk organization, user and membership into our
 * stores and rebuilds the MongoDB copies: `pnpm clerk:sync` (after
 * `pnpm build`). Idempotent; webhooks keep them up to date afterwards.
 */
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});
try {
  const organizations = await app.get(SyncOrganizationsFromProvider).execute();
  console.log(`Organizations synced: ${organizations.applied}`);
  const staff = await app.get(SyncStaffFromProvider).execute();
  console.log(`Staff directory synced: ${staff.applied} changes applied`);
  // Also users that were already in Postgres before Mongo was configured.
  const projected = await app.get<StaffProjection>(STAFF_PROJECTION).rebuildAll();
  console.log(`Staff documents rebuilt in MongoDB: ${projected}`);
} finally {
  await app.close();
}
