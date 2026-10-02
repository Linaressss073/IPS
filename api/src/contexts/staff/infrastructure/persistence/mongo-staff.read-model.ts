import type { Collection, Db } from 'mongodb';
import { TeamId } from '../../../../shared/domain/index.js';
import { StaffReadModel } from '../../application/ports/staff-read-model.port.js';
import { StaffMemberView } from '../../application/types/staff.types.js';
import { DELETED_USER_NAME } from '../../domain/constants/staff.constants.js';
import { STAFF_COLLECTION, StaffDocument } from './staff.document.js';

export class MongoStaffReadModel implements StaffReadModel {
  private readonly staff: Collection<StaffDocument>;

  constructor(db: Db) {
    this.staff = db.collection<StaffDocument>(STAFF_COLLECTION);
  }

  /** By name (people without a name last), then id. */
  async listForTeam(teamId: TeamId): Promise<StaffMemberView[]> {
    const docs = await this.staff
      .find({ 'teams.teamId': teamId.value, deleted: false })
      .toArray();
    return docs
      .map((doc) => toView(doc, teamId)!)
      .sort(
        (a, b) =>
          compareNames(a.displayName, b.displayName) || a.userId.localeCompare(b.userId),
      );
  }

  async member(teamId: TeamId, userId: string): Promise<StaffMemberView | null> {
    const doc = await this.staff.findOne({ _id: userId, 'teams.teamId': teamId.value });
    return doc ? toView(doc, teamId) : null;
  }

  async rolesOf(teamId: TeamId, userId: string): Promise<string[] | null> {
    const doc = await this.staff.findOne(
      { _id: userId, 'teams.teamId': teamId.value },
      { projection: { teams: 1 } },
    );
    const team = doc?.teams.find((entry) => entry.teamId === teamId.value);
    return team ? (team.roles ?? []) : null;
  }

  async namesFor(userIds: readonly string[]): Promise<Map<string, string>> {
    const docs = await this.staff
      .find(
        { _id: { $in: [...userIds] } },
        { projection: { displayName: 1, deleted: 1 } },
      )
      .toArray();

    const names = new Map<string, string>();
    for (const doc of docs) {
      const name = doc.deleted ? DELETED_USER_NAME : doc.displayName;
      if (name) names.set(doc._id, name);
    }
    return names;
  }
}

function toView(doc: StaffDocument, teamId: TeamId): StaffMemberView | null {
  const team = doc.teams.find((entry) => entry.teamId === teamId.value);
  if (!team) return null;
  return {
    userId: doc._id,
    displayName: doc.displayName,
    emailMasked: doc.emailMasked,
    providerRole: team.providerRole,
    // Documents from before roles existed have none.
    roles: team.roles ?? [],
  };
}

function compareNames(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b, 'es');
}
