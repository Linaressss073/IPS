import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { GetStaffNames } from './application/queries/get-staff-names.query.js';
import { ClerkWebhookController } from './entrypoints/http/controllers/clerk-webhook.controller.js';
import { StaffController } from './entrypoints/http/controllers/staff.controller.js';
import { staffProviders } from './infrastructure/providers/staff.providers.js';
import { SyncStaffFromProvider } from './application/commands/sync-staff-from-provider.command.js';

/**
 * Bounded context "Staff": a minimized local directory of the people who
 * work at each IPS (name, masked e-mail, roles), kept in sync with the
 * identity provider through signed webhooks and an idempotent bulk sync.
 */
@Module({
  imports: [IdentityAccessModule],
  controllers: [ClerkWebhookController, StaffController],
  providers: staffProviders,
  // Public query for other contexts (names in the patient timeline) and the
  // bulk sync used by the sync script.
  exports: [GetStaffNames, SyncStaffFromProvider],
})
export class StaffModule {}
