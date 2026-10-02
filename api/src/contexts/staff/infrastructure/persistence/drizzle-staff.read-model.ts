import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { TeamId } from '../../../../shared/domain/index.js';
import { Database } from '../../../../shared/infrastructure/persistence/database.module.js';
import { StaffReadModel } from '../../application/ports/staff-read-model.port.js';
import { StaffMemberView } from '../../application/types/staff.types.js';
import { DELETED_USER_NAME } from '../../domain/constants/staff.constants.js';
import { staffMemberships, staffUsers } from './staff.schema.js';

export class DrizzleStaffReadModel implements StaffReadModel {
  constructor(private readonly db: Database) {}

  async listForTeam(teamId: TeamId): Promise<StaffMemberView[]> {
    return this.db
      .select({
        userId: staffMemberships.userId,
        displayName: staffUsers.displayName,
        emailMasked: staffUsers.emailMasked,
        providerRole: staffMemberships.providerRole,
        clinicalRole: staffMemberships.clinicalRole,
      })
      .from(staffMemberships)
      .leftJoin(staffUsers, eq(staffUsers.userId, staffMemberships.userId))
      .where(
        and(eq(staffMemberships.teamId, teamId.value), isNull(staffUsers.deletedAt)),
      )
      .orderBy(asc(staffUsers.displayName), asc(staffMemberships.userId));
  }

  async namesFor(userIds: readonly string[]): Promise<Map<string, string>> {
    const rows = await this.db
      .select({
        userId: staffUsers.userId,
        displayName: staffUsers.displayName,
        deletedAt: staffUsers.deletedAt,
      })
      .from(staffUsers)
      .where(inArray(staffUsers.userId, [...userIds]));

    const names = new Map<string, string>();
    for (const row of rows) {
      const name = row.deletedAt ? DELETED_USER_NAME : row.displayName;
      if (name) names.set(row.userId, name);
    }
    return names;
  }
}
