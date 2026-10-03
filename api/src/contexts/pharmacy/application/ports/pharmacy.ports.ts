import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { Dispensation, DispensationId } from '../../domain/entities/dispensation.entity.js';

/** Port (write side); every write stores its trace events atomically. */
export interface DispensationRepository {
  /** Dispensations of these consultations (those that have one). */
  findMany(teamId: TeamId, consultationIds: readonly string[]): Promise<Dispensation[]>;
  exists(teamId: TeamId, id: DispensationId): Promise<boolean>;
  /** Throws DispensationVersionConflictError if it changed since loaded (or was created meanwhile). */
  save(dispensation: Dispensation, events: readonly TraceEvent[]): Promise<void>;
  /** Throws if the team has none for this consultation: check `exists` first. */
  getById(teamId: TeamId, id: DispensationId): Promise<Dispensation>;
}

/** A signed prescription, as the Consultation context lets the pharmacy see it. */
export interface SourcePrescription {
  consultationId: string;
  patientId: string;
  physicianId: string;
  date: string;
  signedAt: string;
  items: {
    medication: string;
    presentation: string;
    dose: string;
    route: string;
    frequency: string;
    durationDays: number;
    quantity: number;
    instructions: string;
  }[];
}

/** Port to Consultation (throws PRESCRIPTION_NOT_FOUND unless signed with medications). */
export interface PrescriptionSource {
  list(teamId: TeamId, filter: { date?: string; patientId?: string }): Promise<SourcePrescription[]>;
  get(teamId: TeamId, consultationId: string): Promise<SourcePrescription>;
}

/** Port to Admission: the pharmacy's "FAR n" turns on the waiting-room screen. */
export interface PharmacyTurns {
  issue(input: {
    teamId: TeamId;
    consultationId: string;
    patientId: string;
    window: { id: string; label: string };
    executedBy: string;
  }): Promise<{ id: string; label: string; location: { label: string } }>;
}

/** Port to Scheduling: pharmacy windows are active locations (e.g. "Farmacia 1"). */
export interface PharmacyWindows {
  list(teamId: TeamId): Promise<{ id: string; label: string; active: boolean }[]>;
}

/** Port to Patients and Staff. */
export interface PharmacyNames {
  patients(teamId: TeamId, ids: readonly string[]): Promise<Map<string, { fullName: string; document: { type: string; number: string } }>>;
  staff(ids: readonly string[]): Promise<Map<string, string>>;
}
