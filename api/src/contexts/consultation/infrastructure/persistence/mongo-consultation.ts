import type { Collection, Db, Filter, MongoClient } from 'mongodb';
import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  inTransaction,
  isDuplicateKey,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { appendTraceEvents } from '../../../../shared/infrastructure/persistence/trace-event.writer.js';
import {
  ConsultationAlreadyStartedError,
  ConsultationNotFoundError,
  ConsultationVersionConflictError,
  PrescriptionNotFoundError,
} from '../../application/errors/consultation.errors.js';
import { toConsultationView } from '../../application/mappings/consultation.mapper.js';
import {
  ConsultationReadModel,
  ConsultationRepository,
} from '../../application/ports/consultation.ports.js';
import { ConsultationView, PrescriptionView } from '../../application/types/consultation.types.js';
import {
  ClinicalNote,
  Diagnoses,
  Prescription,
  VitalSigns,
} from '../../domain/entities/clinical-record.vo.js';
import {
  AppointmentSnapshot,
  Consultation,
  ConsultationId,
  Signature,
} from '../../domain/entities/consultation.entity.js';
import {
  AddendumProps,
  DiagnosisProps,
  NoteProps,
  PrescriptionItemProps,
  VitalSignProps,
} from '../../domain/types/consultation.types.js';

export const CONSULTATIONS_COLLECTION = 'consultations';

/** The clinical record: only physicians (clinical:read) can read it. */
interface ConsultationDocument {
  _id: string;
  teamId: string;
  appointment: AppointmentSnapshot;
  note: NoteProps;
  vitals: VitalSignProps[];
  diagnoses: DiagnosisProps[];
  prescription: PrescriptionItemProps[];
  signature: Signature;
  addenda: AddendumProps[];
  startedAt: Date;
  updatedAt: Date;
  version: number;
}

export async function ensureConsultationIndexes(db: Db): Promise<void> {
  await db.collection(CONSULTATIONS_COLLECTION).createIndexes([
    // One consultation per appointment, even with two clicks at once.
    { key: { 'appointment.id': 1 }, name: 'appointment_uq', unique: true },
    { key: { teamId: 1, 'appointment.patientId': 1, startedAt: -1 }, name: 'team_patient' },
    { key: { teamId: 1, 'appointment.date': 1, 'signature.signed': 1 }, name: 'team_date_signed' },
  ]);
}

function toDocument(consultation: Consultation): ConsultationDocument {
  return {
    _id: consultation.id.value,
    teamId: consultation.teamId.value,
    appointment: consultation.appointment,
    note: consultation.note.value,
    vitals: consultation.vitals.value,
    diagnoses: consultation.diagnoses.value,
    prescription: consultation.prescription.value,
    signature: consultation.signature,
    addenda: [...consultation.addenda],
    startedAt: consultation.startedAt,
    updatedAt: consultation.updatedAt,
    version: consultation.version,
  };
}

/** Stored values passed the same rules when written, so restoring them through the value objects cannot fail. */
function toDomain(doc: ConsultationDocument): Consultation {
  return Consultation.restore(ConsultationId.of(doc._id), {
    teamId: TeamId.of(doc.teamId),
    appointment: doc.appointment,
    note: ClinicalNote.of(doc.note),
    vitals: VitalSigns.of(doc.vitals),
    diagnoses: Diagnoses.of(doc.diagnoses),
    prescription: Prescription.of(doc.prescription),
    signature: doc.signature,
    addenda: doc.addenda,
    startedAt: doc.startedAt,
    updatedAt: doc.updatedAt,
    version: doc.version,
  });
}

export class MongoConsultationRepository implements ConsultationRepository {
  private readonly consultations: Collection<ConsultationDocument>;

  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {
    this.consultations = db.collection<ConsultationDocument>(CONSULTATIONS_COLLECTION);
  }

  async getById(teamId: TeamId, id: ConsultationId): Promise<Consultation> {
    return toDomain(await this.findOne({ _id: id.value, teamId: teamId.value }, id.value));
  }

  async getByAppointment(teamId: TeamId, appointmentId: string): Promise<Consultation> {
    return toDomain(await this.findOne({ 'appointment.id': appointmentId, teamId: teamId.value }, appointmentId));
  }

  async add(consultation: Consultation, events: readonly TraceEvent[]): Promise<void> {
    try {
      await inTransaction(this.client, async (session) => {
        await this.consultations.insertOne(toDocument(consultation), { session });
        await appendTraceEvents(this.db, events, session);
      });
    } catch (error) {
      if (isDuplicateKey(error)) throw new ConsultationAlreadyStartedError();
      throw error;
    }
  }

  async save(consultation: Consultation, events: readonly TraceEvent[]): Promise<void> {
    const { _id, teamId, ...fields } = toDocument(consultation);
    await inTransaction(this.client, async (session) => {
      const result = await this.consultations.updateOne(
        { _id, teamId, version: consultation.version - 1 },
        { $set: fields },
        { session },
      );
      if (result.matchedCount === 0) throw new ConsultationVersionConflictError(_id);
      await appendTraceEvents(this.db, events, session);
    });
  }

  private async findOne(filter: Filter<ConsultationDocument>, id: string): Promise<ConsultationDocument> {
    const doc = await this.consultations.findOne(filter);
    if (!doc) throw new ConsultationNotFoundError(id);
    return doc;
  }
}

export class MongoConsultationReadModel implements ConsultationReadModel {
  private readonly consultations: Collection<ConsultationDocument>;

  constructor(db: Db) {
    this.consultations = db.collection<ConsultationDocument>(CONSULTATIONS_COLLECTION);
  }

  async getById(teamId: TeamId, id: string): Promise<ConsultationView> {
    const doc = await this.consultations.findOne({ _id: id, teamId: teamId.value });
    if (!doc) throw new ConsultationNotFoundError(id);
    return toConsultationView(toDomain(doc));
  }

  async list(teamId: TeamId, filter: { patientId?: string; appointmentId?: string }): Promise<ConsultationView[]> {
    const docs = await this.consultations
      .find({
        teamId: teamId.value,
        ...(filter.patientId && { 'appointment.patientId': filter.patientId }),
        ...(filter.appointmentId && { 'appointment.id': filter.appointmentId }),
      })
      .sort({ startedAt: -1 })
      .limit(200)
      .toArray();
    return docs.map((doc) => toConsultationView(toDomain(doc)));
  }

  async prescriptions(teamId: TeamId, filter: { date?: string; patientId?: string }): Promise<PrescriptionView[]> {
    const docs = await this.consultations
      .find({
        teamId: teamId.value,
        'signature.signed': true,
        'prescription.0': { $exists: true },
        ...(filter.date && { 'appointment.date': filter.date }),
        ...(filter.patientId && { 'appointment.patientId': filter.patientId }),
      })
      .project<ConsultationDocument>({ note: 0, diagnoses: 0, vitals: 0, addenda: 0 })
      .sort({ 'signature.at': -1 })
      .limit(500)
      .toArray();
    return docs.map(toPrescriptionView);
  }

  async prescription(teamId: TeamId, consultationId: string): Promise<PrescriptionView> {
    const doc = await this.consultations.findOne(
      { _id: consultationId, teamId: teamId.value, 'signature.signed': true, 'prescription.0': { $exists: true } },
      { projection: { note: 0, diagnoses: 0, vitals: 0, addenda: 0 } },
    );
    if (!doc) throw new PrescriptionNotFoundError(consultationId);
    return toPrescriptionView(doc);
  }
}

/** Only the prescription: the clinical note never leaves for the pharmacy. */
function toPrescriptionView(doc: Pick<ConsultationDocument, '_id' | 'appointment' | 'signature' | 'prescription'>): PrescriptionView {
  return {
    consultationId: doc._id,
    patientId: doc.appointment.patientId,
    physicianId: doc.appointment.professionalId,
    date: doc.appointment.date,
    signedAt: doc.signature.signed ? doc.signature.at.toISOString() : '',
    items: doc.prescription,
  };
}
