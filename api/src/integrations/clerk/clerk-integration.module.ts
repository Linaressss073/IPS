import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../../contexts/organizations/organizations.module.js';
import { StaffModule } from '../../contexts/staff/staff.module.js';
import { ClerkReconciler } from './clerk-reconciler.js';
import { ClerkWebhookController } from './clerk-webhook.controller.js';

/**
 * Inbound integration with Clerk: its webhooks feed the contexts that keep a
 * copy of Clerk data (staff and organizations) without either depending on
 * the other, and a periodic reconciliation catches whatever a webhook missed.
 */
@Module({
  imports: [StaffModule, OrganizationsModule],
  controllers: [ClerkWebhookController],
  providers: [ClerkReconciler],
})
export class ClerkIntegrationModule {}
