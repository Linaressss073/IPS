import { StaffReadModel } from '../ports/staff-read-model.port.js';

/**
 * Public query for other contexts: display names of user ids (e.g. who
 * requested or executed a traced change). Names are resolved at read time
 * and never copied into trace events, so anonymizing a user hides their
 * name everywhere at once.
 */
export class GetStaffNames {
  constructor(private readonly readModel: StaffReadModel) {}

  async execute(userIds: readonly string[]): Promise<Map<string, string>> {
    const unique = [...new Set(userIds)];
    return unique.length ? this.readModel.namesFor(unique) : new Map();
  }
}
