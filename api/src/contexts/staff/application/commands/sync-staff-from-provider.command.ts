import { IdentitySource } from '../ports/identity-source.port.js';
import { ApplyIdentityChange } from './apply-identity-change.command.js';

/**
 * Bulk load of every current user and membership, for the first setup or
 * to recover from missed webhooks. Safe to run any number of times.
 */
export class SyncStaffFromProvider {
  constructor(
    private readonly source: IdentitySource,
    private readonly apply: ApplyIdentityChange,
  ) {}

  async execute(): Promise<{ applied: number }> {
    let applied = 0;
    for await (const change of this.source.snapshot()) {
      await this.apply.execute(change);
      applied += 1;
    }
    return { applied };
  }
}
