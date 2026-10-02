import { Clock } from '../../../../shared/application/index.js';
import { OrganizationName } from '../../domain/entities/organization-name.vo.js';
import { Organization } from '../../domain/entities/organization.entity.js';
import { OrganizationAlreadyStoredError } from '../errors/organization.errors.js';
import { OrganizationRepository } from '../ports/organization.repository.port.js';
import { OrganizationChange } from '../types/organization.types.js';

/** Keeps the `organizations` collection in step with one provider change. */
export class ApplyOrganizationChange {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(change: OrganizationChange): Promise<void> {
    const now = this.clock.now();

    if (change.kind === 'organization.deleted') {
      const stored = await this.organizations.findById(change.id);
      if (!stored) return;
      const version = stored.version;
      if (stored.deleteFromProvider(now)) {
        await this.organizations.save(stored, version);
      }
      return;
    }

    const { id, name, updatedAt } = change.organization;
    const stored = await this.organizations.findById(id);
    if (!stored) {
      try {
        await this.organizations.insert(
          Organization.importFromProvider({
            id,
            name: OrganizationName.of(name),
            providerUpdatedAt: updatedAt,
            now,
          }),
        );
        return;
      } catch (error) {
        if (!(error instanceof OrganizationAlreadyStoredError)) throw error;
        return this.execute(change);
      }
    }

    const version = stored.version;
    if (stored.syncFromProvider(OrganizationName.of(name), updatedAt, now)) {
      await this.organizations.save(stored, version);
    }
  }
}
