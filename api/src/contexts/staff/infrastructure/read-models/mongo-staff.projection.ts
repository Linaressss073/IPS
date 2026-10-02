import { asc, gt, inArray } from 'drizzle-orm';
import type { AnyBulkWriteOperation, Collection, Db } from 'mongodb';
import { Database } from '../../../../shared/infrastructure/persistence/database.module.js';
import { StaffProjection } from '../../application/ports/staff-projection.port.js';
import { staffMemberships, staffUsers } from '../persistence/staff.schema.js';

export const STAFF_COLLECTION = 'staff';

const BATCH_SIZE = 500;

/**
 * One document per user with the IPS they belong to. Same minimization as
 * Postgres: name, masked e-mail and roles, never the full e-mail.
 */
export interface StaffDocument {
  _id: string;
  displayName: string | null;
  emailMasked: string | null;
  deleted: boolean;
  deletedAt: Date | null;
  teams: { teamId: string; providerRole: string; clinicalRole: string | null }[];
  sourceUpdatedAt: Date;
  projectedAt: Date;
}

/** Rebuilds documents from Postgres (the source of truth) on every refresh. */
export class MongoStaffProjection implements StaffProjection {
  private readonly collection: Collection<StaffDocument>;
  private indexReady = false;

  constructor(
    private readonly db: Database,
    mongo: Db,
  ) {
    this.collection = mongo.collection<StaffDocument>(STAFF_COLLECTION);
  }

  async refresh(userIds: readonly string[]): Promise<void> {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return;
    await this.ensureIndex();

    const [users, memberships] = await Promise.all([
      this.db.select().from(staffUsers).where(inArray(staffUsers.userId, ids)),
      this.db
        .select()
        .from(staffMemberships)
        .where(inArray(staffMemberships.userId, ids))
        .orderBy(asc(staffMemberships.teamId)),
    ]);

    const now = new Date();
    const operations: AnyBulkWriteOperation<StaffDocument>[] = ids.map((id) => {
      const user = users.find((row) => row.userId === id);
      if (!user) return { deleteOne: { filter: { _id: id } } };
      const replacement: Omit<StaffDocument, '_id'> = {
        displayName: user.displayName,
        emailMasked: user.emailMasked,
        deleted: user.deletedAt !== null,
        deletedAt: user.deletedAt,
        teams: memberships
          .filter((row) => row.userId === id)
          .map((row) => ({
            teamId: row.teamId,
            providerRole: row.providerRole,
            clinicalRole: row.clinicalRole,
          })),
        sourceUpdatedAt: user.sourceUpdatedAt,
        projectedAt: now,
      };
      return { replaceOne: { filter: { _id: id }, replacement, upsert: true } };
    });
    await this.collection.bulkWrite(operations, { ordered: false });
  }

  async rebuildAll(): Promise<number> {
    let total = 0;
    let after = '';
    for (;;) {
      const rows = await this.db
        .select({ userId: staffUsers.userId })
        .from(staffUsers)
        .where(gt(staffUsers.userId, after))
        .orderBy(asc(staffUsers.userId))
        .limit(BATCH_SIZE);
      if (rows.length === 0) return total;
      await this.refresh(rows.map((row) => row.userId));
      total += rows.length;
      after = rows[rows.length - 1].userId;
    }
  }

  /** "Who works at this IPS" queries go through teams.teamId. */
  private async ensureIndex(): Promise<void> {
    if (this.indexReady) return;
    await this.collection.createIndex({ 'teams.teamId': 1 });
    this.indexReady = true;
  }
}

/** Used when MONGO_URL is not set: Postgres alone holds the directory. */
export class NoStaffProjection implements StaffProjection {
  async refresh(): Promise<void> {}

  async rebuildAll(): Promise<number> {
    return 0;
  }
}
