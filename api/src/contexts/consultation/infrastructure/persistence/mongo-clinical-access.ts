import type { Db } from 'mongodb';
import { TeamId } from '../../../../shared/domain/index.js';
import { ClinicalAccessEntry, ClinicalAccessLog } from '../../application/ports/consultation.ports.js';
import { ClinicalAccessKind } from '../../application/types/consultation.types.js';

export const CLINICAL_ACCESS_COLLECTION = 'clinical_access';

interface ClinicalAccessDocument {
  _id: string;
  teamId: string;
  patientId: string;
  consultationId: string | null;
  userId: string;
  kind: ClinicalAccessKind;
  at: Date;
}

export async function ensureClinicalAccessIndexes(db: Db): Promise<void> {
  await db
    .collection(CLINICAL_ACCESS_COLLECTION)
    .createIndex({ teamId: 1, patientId: 1, at: -1 }, { name: 'team_patient_at' });
}

export class MongoClinicalAccessLog implements ClinicalAccessLog {
  constructor(private readonly db: Db) {}

  private get collection() {
    return this.db.collection<ClinicalAccessDocument>(CLINICAL_ACCESS_COLLECTION);
  }

  async record(teamId: TeamId, entries: readonly ClinicalAccessEntry[]): Promise<void> {
    await this.collection.insertMany(
      entries.map((entry) => ({ _id: crypto.randomUUID(), teamId: teamId.value, ...entry })),
    );
  }

  async list(teamId: TeamId, patientId: string, limit: number): Promise<ClinicalAccessEntry[]> {
    const docs = await this.collection.find({ teamId: teamId.value, patientId }).sort({ at: -1 }).limit(limit).toArray();
    return docs.map(({ patientId: patient, consultationId, userId, kind, at }) => ({
      patientId: patient,
      consultationId,
      userId,
      kind,
      at,
    }));
  }
}
