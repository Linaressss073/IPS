import type { Collection, Db, Filter } from 'mongodb';
import { TeamId } from '../../../../shared/domain/index.js';
import { PatientReadModel } from '../../application/ports/patient-read-model.port.js';
import { Page, PatientView } from '../../application/types/patient.types.js';
import { PatientDocument, PATIENTS_COLLECTION } from './patient.document.js';
import { PatientMapper } from './patient.mapper.js';
import { escapeRegex, normalizeForSearch } from './search-text.js';

/** Read side over the patients collection: documents go straight to views. */
export class MongoPatientReadModel implements PatientReadModel {
  private readonly patients: Collection<PatientDocument>;

  constructor(db: Db) {
    this.patients = db.collection<PatientDocument>(PATIENTS_COLLECTION);
  }

  async findById(
    teamId: TeamId,
    patientId: string,
  ): Promise<PatientView | null> {
    const doc = await this.patients.findOne({ _id: patientId, teamId: teamId.value });
    return doc ? PatientMapper.toView(doc) : null;
  }

  /** Every word of `q` must appear in the document number or the names. */
  async search(params: {
    teamId: TeamId;
    q: string;
    page: number;
    pageSize: number;
  }): Promise<Page<PatientView>> {
    const words = normalizeForSearch(params.q).split(' ').filter(Boolean);
    const filter: Filter<PatientDocument> = {
      teamId: params.teamId.value,
      ...(words.length > 0 && {
        $and: words.map((word) => ({ searchText: { $regex: escapeRegex(word) } })),
      }),
    };

    const [docs, total] = await Promise.all([
      this.patients
        .find(filter)
        .sort({ 'name.firstLastName': 1, 'name.firstName': 1, _id: 1 })
        .skip((params.page - 1) * params.pageSize)
        .limit(params.pageSize)
        .toArray(),
      this.patients.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => PatientMapper.toView(doc)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
