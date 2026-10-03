import type { Collection, Db, Filter } from 'mongodb';
import { TeamId } from '../../../../shared/domain/index.js';
import { PatientNotFoundError } from '../../application/errors/patient.errors.js';
import { PatientReadModel } from '../../application/ports/patient-read-model.port.js';
import { PatientId } from '../../domain/entities/patient-id.vo.js';
import {
  Page,
  PatientSummaryView,
  PatientView,
} from '../../application/types/patient.types.js';
import { PatientDocument, PATIENTS_COLLECTION } from './patient.document.js';
import { PatientMapper } from './patient.mapper.js';
import { escapeRegex, normalizeForSearch } from '../../../../shared/domain/index.js';

/** Read side over the patients collection: documents go straight to views. */
export class MongoPatientReadModel implements PatientReadModel {
  private readonly patients: Collection<PatientDocument>;

  constructor(db: Db) {
    this.patients = db.collection<PatientDocument>(PATIENTS_COLLECTION);
  }

  async getById(teamId: TeamId, patientId: string): Promise<PatientView> {
    const doc = await this.patients.findOne({ _id: patientId, teamId: teamId.value });
    if (!doc) throw new PatientNotFoundError(PatientId.of(patientId));
    return PatientMapper.toView(doc);
  }

  async summaries(
    teamId: TeamId,
    patientIds: string[],
  ): Promise<Map<string, PatientSummaryView>> {
    const docs = await this.patients
      .find(
        { teamId: teamId.value, _id: { $in: patientIds } },
        { projection: { name: 1, document: 1 } },
      )
      .toArray();
    return new Map(
      docs.map((doc) => [
        doc._id,
        {
          id: doc._id,
          fullName: Object.values(doc.name).filter(Boolean).join(' '),
          shortName: `${doc.name.firstName} ${doc.name.firstLastName}`,
          document: { ...doc.document },
        },
      ]),
    );
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
