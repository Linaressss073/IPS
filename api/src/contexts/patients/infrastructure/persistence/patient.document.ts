import type { Db } from 'mongodb';

export const PATIENTS_COLLECTION = 'patients';

/** Persistence model of the Patient aggregate (write side and read model). */
export interface PatientDocument {
  _id: string;
  /** Identity-provider organization id (e.g. Clerk "org_…"). */
  teamId: string;
  document: { type: string; number: string };
  name: {
    firstName: string;
    middleName: string | null;
    firstLastName: string;
    secondLastName: string | null;
  };
  birthDate: string;
  sex: string;
  contact: { email: string; phone: string | null; address: string | null };
  affiliation: { eps: string | null; regime: string };
  /** Lower-case, accent-free document number and names, for searching. */
  searchText: string;
  /** Companions recorded so far; the next one gets this + 1. */
  companionCount: number;
  version: number;
  registeredAt: Date;
  updatedAt: Date;
}

export async function ensurePatientIndexes(db: Db): Promise<void> {
  const patients = db.collection<PatientDocument>(PATIENTS_COLLECTION);
  await patients.createIndexes([
    // One record per document and IPS.
    {
      key: { teamId: 1, 'document.type': 1, 'document.number': 1 },
      name: 'team_document_uq',
      unique: true,
    },
    {
      key: { teamId: 1, 'name.firstLastName': 1, 'name.firstName': 1 },
      name: 'team_name',
    },
  ]);
}
