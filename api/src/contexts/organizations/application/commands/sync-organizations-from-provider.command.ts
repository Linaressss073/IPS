import { OrganizationProvider } from '../ports/organization-provider.port.js';
import { ApplyOrganizationChange } from './apply-organization-change.command.js';

/** Bulk load of every provider organization; safe to run any number of times. */
export class SyncOrganizationsFromProvider {
  constructor(
    private readonly provider: OrganizationProvider,
    private readonly apply: ApplyOrganizationChange,
  ) {}

  async execute(): Promise<{ applied: number }> {
    let applied = 0;
    for await (const organization of this.provider.list()) {
      await this.apply.execute({ kind: 'organization.upserted', organization });
      applied += 1;
    }
    return { applied };
  }
}
