import type { Collection, Db, MongoClient } from 'mongodb';
import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  inTransaction,
  isDuplicateKey,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { appendTraceEvents } from '../../../../shared/infrastructure/persistence/trace-event.writer.js';
import { StaffRepository } from '../../application/ports/staff.repository.port.js';
import { StaffProfile } from '../../domain/entities/staff-profile.vo.js';
import {
  STAFF_COLLECTION,
  StaffDocument,
  UNKNOWN_SOURCE_DATE,
} from './staff.document.js';

/**
 * Conditional upserts: when the filter does not match an existing user
 * (newer data, or anonymized), the upsert tries to insert the same _id and
 * fails with a duplicate key, which here means "nothing to do".
 */
export class MongoStaffRepository implements StaffRepository {
  private readonly staff: Collection<StaffDocument>;

  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {
    this.staff = db.collection<StaffDocument>(STAFF_COLLECTION);
  }

  async saveProfile(
    profile: StaffProfile,
    options: { onlyIfMissing?: boolean } = {},
  ): Promise<void> {
    // Late, older webhooks never overwrite newer data, and an anonymized
    // user is never "revived" by a stale update. `onlyIfMissing` only fills
    // users we know solely from a membership (still at the epoch).
    const sourceUpdatedAt = options.onlyIfMissing
      ? UNKNOWN_SOURCE_DATE
      : { $lte: profile.sourceUpdatedAt };
    await ignoreDuplicate(
      this.staff.updateOne(
        { _id: profile.userId, deleted: false, sourceUpdatedAt },
        {
          $set: {
            displayName: profile.displayName,
            emailMasked: profile.emailMasked,
            sourceUpdatedAt: profile.sourceUpdatedAt,
          },
          $setOnInsert: { deleted: false, deletedAt: null, teams: [] },
        },
        { upsert: true },
      ),
    );
  }

  async anonymize(userId: string, at: Date): Promise<void> {
    await this.staff.updateOne(
      { _id: userId },
      {
        $set: {
          displayName: null,
          emailMasked: null,
          deleted: true,
          deletedAt: at,
          teams: [],
        },
        $setOnInsert: { sourceUpdatedAt: at },
      },
      { upsert: true },
    );
  }

  async saveMembership(input: {
    teamId: TeamId;
    userId: string;
    providerRole: string;
    sourceUpdatedAt: Date;
  }): Promise<void> {
    const added = await this.addMembership(
      input.teamId,
      input.userId,
      input.providerRole,
      input.sourceUpdatedAt,
    );
    if (added) return;
    // The roles are ours: provider updates never reset them.
    await this.staff.updateOne(
      { _id: input.userId },
      {
        $set: {
          'teams.$[team].providerRole': input.providerRole,
          'teams.$[team].sourceUpdatedAt': input.sourceUpdatedAt,
        },
      },
      {
        arrayFilters: [
          {
            'team.teamId': input.teamId.value,
            'team.sourceUpdatedAt': { $lte: input.sourceUpdatedAt },
          },
        ],
      },
    );
  }

  async removeMembership(teamId: TeamId, userId: string): Promise<void> {
    await this.staff.updateOne(
      { _id: userId },
      { $pull: { teams: { teamId: teamId.value } } },
    );
  }

  async ensureMembership(
    teamId: TeamId,
    userId: string,
    providerRole: string,
  ): Promise<void> {
    await this.addMembership(teamId, userId, providerRole, UNKNOWN_SOURCE_DATE);
  }

  async setRoles(
    teamId: TeamId,
    userId: string,
    roles: readonly string[],
    events: readonly TraceEvent[],
  ): Promise<void> {
    await inTransaction(this.client, async (session) => {
      await this.staff.updateOne(
        { _id: userId, 'teams.teamId': teamId.value },
        { $set: { 'teams.$.roles': [...roles] } },
        { session },
      );
      await appendTraceEvents(this.db, events, session);
    });
  }

  async removeTeam(teamId: TeamId): Promise<string[]> {
    const members = await this.staff
      .find({ 'teams.teamId': teamId.value }, { projection: { _id: 1 } })
      .toArray();
    await this.staff.updateMany(
      { 'teams.teamId': teamId.value },
      { $pull: { teams: { teamId: teamId.value } } },
    );
    return members.map((member) => member._id);
  }

  /**
   * Adds the membership if the user does not have it yet (creating a
   * nameless user if needed). False if it already existed or the user was
   * anonymized.
   */
  private async addMembership(
    teamId: TeamId,
    userId: string,
    providerRole: string,
    sourceUpdatedAt: Date,
  ): Promise<boolean> {
    await ignoreDuplicate(
      this.staff.updateOne(
        { _id: userId },
        {
          $setOnInsert: {
            displayName: null,
            emailMasked: null,
            deleted: false,
            deletedAt: null,
            teams: [],
            sourceUpdatedAt: UNKNOWN_SOURCE_DATE,
          },
        },
        { upsert: true },
      ),
    );
    const result = await this.staff.updateOne(
      { _id: userId, deleted: false, 'teams.teamId': { $ne: teamId.value } },
      {
        $push: {
          teams: { teamId: teamId.value, providerRole, roles: [], sourceUpdatedAt },
        },
      },
    );
    return result.modifiedCount > 0;
  }
}

async function ignoreDuplicate(write: Promise<unknown>): Promise<void> {
  try {
    await write;
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }
}
