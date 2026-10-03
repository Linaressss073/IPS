import { Clock } from '../../../../shared/application/index.js';
import { OrganizationProvider } from '../ports/organization-provider.port.js';
import { OrganizationRepository } from '../ports/organization.repository.port.js';
import { ApplyOrganizationChange } from './apply-organization-change.command.js';

/**
 * Reconciles the `organizations` collection with the provider: applies every
 * current organization, then marks as deleted the ones the provider no
 * longer has (a missed `organization.deleted` webhook). Same safeguards as
 * the staff sync: only data older than the run, and never on an empty list.
 */
export class SyncOrganizationsFromProvider {
  constructor(
    private readonly provider: OrganizationProvider,
    private readonly apply: ApplyOrganizationChange,
    private readonly organizations: OrganizationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<{ applied: number; removed: number }> {
    const startedAt = this.clock.now();
    const seen = new Set<string>();
    for await (const organization of this.provider.list()) {
      seen.add(organization.id.value);
      await this.apply.execute({ kind: 'organization.upserted', organization });
    }
    if (seen.size === 0) return { applied: 0, removed: 0 };

    let removed = 0;
    for (const stored of await this.organizations.listActive()) {
      if (!seen.has(stored.id.value) && stored.providerUpdatedAt < startedAt) {
        await this.apply.execute({ kind: 'organization.deleted', id: stored.id });
        removed += 1;
      }
    }
    return { applied: seen.size, removed };
  }
}
