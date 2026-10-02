import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { ApplyOrganizationChange } from './application/commands/apply-organization-change.command.js';
import { SyncOrganizationsFromProvider } from './application/commands/sync-organizations-from-provider.command.js';
import { OrganizationsController } from './entrypoints/http/controllers/organizations.controller.js';
import { organizationsProviders } from './infrastructure/providers/organizations.providers.js';

/**
 * Bounded context "Organizations": each IPS's own data (NIT, REPS code,
 * address…) in the MongoDB `organizations` collection, kept in step with
 * the identity provider, which owns its name and who can access it.
 */
@Module({
  imports: [IdentityAccessModule],
  controllers: [OrganizationsController],
  providers: organizationsProviders,
  // Used by the Clerk webhooks and the bulk sync script.
  exports: [ApplyOrganizationChange, SyncOrganizationsFromProvider],
})
export class OrganizationsModule {}
