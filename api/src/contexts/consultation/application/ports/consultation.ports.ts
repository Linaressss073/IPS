import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { AppointmentSnapshot, Consultation, ConsultationId } from '../../domain/entities/consultation.entity.js';
import { ConsultationView } from '../types/consultation.types.js';

/** Port (write side); every write stores its trace events atomically. */
export interface ConsultationRepository {
  /** Throws ConsultationNotFoundError. */
  getById(teamId: TeamId, id: ConsultationId): Promise<Consultation>;
  /** Throws ConsultationNotFoundError if the appointment has none yet. */
  getByAppointment(teamId: TeamId, appointmentId: string): Promise<Consultation>;
  /** Throws ConsultationAlreadyStartedError if the appointment already has one. */
  add(consultation: Consultation, events: readonly TraceEvent[]): Promise<void>;
  /** Throws ConsultationVersionConflictError if it changed since it was loaded. */
  save(consultation: Consultation, events: readonly TraceEvent[]): Promise<void>;
}

/** Port (read side): names of other contexts are filled by the queries. */
export interface ConsultationReadModel {
  /** Throws ConsultationNotFoundError. */
  getById(teamId: TeamId, id: string): Promise<ConsultationView>;
  list(teamId: TeamId, filter: { patientId?: string; appointmentId?: string }): Promise<ConsultationView[]>;
}

/** Port to Scheduling (throws its 404 for unknown appointments). */
export interface ConsultationAppointments {
  get(teamId: TeamId, appointmentId: string): Promise<AppointmentSnapshot>;
}

/** Port to Patients and Staff: names shown in the record. */
export interface ConsultationNames {
  patients(teamId: TeamId, ids: readonly string[]): Promise<Map<string, { fullName: string; document: { type: string; number: string } }>>;
  staff(ids: readonly string[]): Promise<Map<string, string>>;
}
