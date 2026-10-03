import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SyncOrganizationsFromProvider } from '../contexts/organizations/application/commands/sync-organizations-from-provider.command.js';
import { SyncStaffFromProvider } from '../contexts/staff/application/commands/sync-staff-from-provider.command.js';

/**
 * Loads every current Clerk organization, user and membership into our
 * stores: `pnpm clerk:sync` (after
 * `pnpm build`). Idempotent; webhooks keep them up to date afterwards.
 */
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});
try {
  const organizations = await app.get(SyncOrganizationsFromProvider).execute();
  console.log(`Organizations synced: ${organizations.applied}, marked deleted: ${organizations.removed}`);
  const staff = await app.get(SyncStaffFromProvider).execute();
  console.log(
    `Staff directory synced: ${staff.applied} changes applied, ${staff.removedUsers} users and ${staff.removedMemberships} memberships removed`,
  );
} finally {
  await app.close();
}
