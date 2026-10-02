import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../../contexts/organizations/organizations.module.js';
import { StaffModule } from '../../contexts/staff/staff.module.js';
import { ClerkWebhookController } from './clerk-webhook.controller.js';

/**
 * Inbound integration with Clerk: its webhooks feed the contexts that keep a
 * copy of Clerk data (staff and organizations) without either depending on
 * the other.
 */
@Module({
  imports: [StaffModule, OrganizationsModule],
  controllers: [ClerkWebhookController],
})
export class ClerkIntegrationModule {}
