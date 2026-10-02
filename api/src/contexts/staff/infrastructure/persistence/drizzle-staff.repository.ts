import { and, eq, lte, sql } from 'drizzle-orm';
import { TeamId } from '../../../../shared/domain/index.js';
import { Database } from '../../../../shared/infrastructure/persistence/database.module.js';
import { StaffRepository } from '../../application/ports/staff.repository.port.js';
import { StaffProfile } from '../../domain/entities/staff-profile.vo.js';
import { staffMemberships, staffUsers } from './staff.schema.js';

export class DrizzleStaffRepository implements StaffRepository {
  constructor(private readonly db: Database) {}

  async saveProfile(
    profile: StaffProfile,
    options: { onlyIfMissing?: boolean } = {},
  ): Promise<void> {
    const row = {
      userId: profile.userId,
      displayName: profile.displayName,
      emailMasked: profile.emailMasked,
      sourceUpdatedAt: profile.sourceUpdatedAt,
    };
    const insert = this.db.insert(staffUsers).values(row);
    if (options.onlyIfMissing) {
      await insert.onConflictDoNothing({ target: staffUsers.userId });
      return;
    }
    // Late, older webhooks never overwrite newer data, and an anonymized
    // user is never "revived" by a stale update.
    await insert.onConflictDoUpdate({
      target: staffUsers.userId,
      set: row,
      setWhere: and(
        lte(staffUsers.sourceUpdatedAt, profile.sourceUpdatedAt),
        sql`${staffUsers.deletedAt} is null`,
      ),
    });
  }

  async anonymize(userId: string, at: Date): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(staffUsers)
        .values({ userId, sourceUpdatedAt: at, deletedAt: at })
        .onConflictDoUpdate({
          target: staffUsers.userId,
          set: { displayName: null, emailMasked: null, deletedAt: at },
        });
      await tx.delete(staffMemberships).where(eq(staffMemberships.userId, userId));
    });
  }

  async saveMembership(input: {
    teamId: TeamId;
    userId: string;
    providerRole: string;
    sourceUpdatedAt: Date;
  }): Promise<void> {
    const row = {
      teamId: input.teamId.value,
      userId: input.userId,
      providerRole: input.providerRole,
      sourceUpdatedAt: input.sourceUpdatedAt,
    };
    // The clinical role is ours: provider updates never reset it.
    await this.db
      .insert(staffMemberships)
      .values(row)
      .onConflictDoUpdate({
        target: [staffMemberships.teamId, staffMemberships.userId],
        set: { providerRole: row.providerRole, sourceUpdatedAt: row.sourceUpdatedAt },
        setWhere: lte(staffMemberships.sourceUpdatedAt, row.sourceUpdatedAt),
      });
  }

  async removeMembership(teamId: TeamId, userId: string): Promise<void> {
    await this.db
      .delete(staffMemberships)
      .where(
        and(
          eq(staffMemberships.teamId, teamId.value),
          eq(staffMemberships.userId, userId),
        ),
      );
  }

  async removeTeam(teamId: TeamId): Promise<void> {
    await this.db
      .delete(staffMemberships)
      .where(eq(staffMemberships.teamId, teamId.value));
  }
}
