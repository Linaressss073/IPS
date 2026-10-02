import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { GetStaffNames } from './application/queries/get-staff-names.query.js';
import { StaffController } from './entrypoints/http/controllers/staff.controller.js';
import { staffProviders } from './infrastructure/providers/staff.providers.js';
import { ApplyIdentityChange } from './application/commands/apply-identity-change.command.js';
import { SyncStaffFromProvider } from './application/commands/sync-staff-from-provider.command.js';
import { STAFF_PROJECTION } from './application/constants/injection-tokens.js';
import { AccessService } from './application/services/access.service.js';
import { PermissionGuard } from './entrypoints/http/guards/permission.guard.js';

/**
 * Bounded context "Staff": a minimized local directory of the people who
 * work at each IPS (name, masked e-mail, roles), kept in sync with the
 * identity provider through signed webhooks and an idempotent bulk sync.
 */
@Module({
  imports: [IdentityAccessModule],
  controllers: [StaffController],
  providers: staffProviders,
  // Public query for other contexts (names in the patient timeline); the
  // Clerk webhooks and the bulk sync script use the two commands.
  // PermissionGuard/AccessService protect other contexts' endpoints (@RequirePermission).
  exports: [
    GetStaffNames,
    ApplyIdentityChange,
    SyncStaffFromProvider,
    STAFF_PROJECTION,
    AccessService,
    PermissionGuard,
  ],
})
export class StaffModule {}
