import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { Agenda } from '../../domain/entities/agenda.entity.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { CareLocation } from '../../domain/entities/care-location.entity.js';
import { MedicalService } from '../../domain/entities/medical-service.entity.js';
import { SchedulingId } from '../../domain/entities/scheduling-id.vo.js';

/**
 * Ports (write side), one per aggregate. Every write stores the aggregate
 * and its trace events atomically.
 */

export interface ServiceRepository {
  findById(teamId: TeamId, id: SchedulingId): Promise<MedicalService | null>;
  /** Throws ServiceCodeTakenError if the code is used in the team. */
  add(service: MedicalService, events: readonly TraceEvent[]): Promise<void>;
  save(service: MedicalService, events: readonly TraceEvent[]): Promise<void>;
}

export interface LocationRepository {
  findById(teamId: TeamId, id: SchedulingId): Promise<CareLocation | null>;
  /** Throws LocationTakenError if kind + number exists in the team. */
  add(location: CareLocation, events: readonly TraceEvent[]): Promise<void>;
  save(location: CareLocation, events: readonly TraceEvent[]): Promise<void>;
}

export interface AgendaRepository {
  findById(teamId: TeamId, id: SchedulingId): Promise<Agenda | null>;
  /** Who already has an agenda overlapping the new one, if anyone. */
  findOverlap(agenda: Agenda): Promise<'professional' | 'location' | null>;
  add(agenda: Agenda, events: readonly TraceEvent[]): Promise<void>;
  remove(agenda: Agenda, events: readonly TraceEvent[]): Promise<void>;
}

export interface AppointmentRepository {
  findById(teamId: TeamId, id: SchedulingId): Promise<Appointment | null>;
  countActiveIn(teamId: TeamId, agendaId: SchedulingId): Promise<number>;
  /** Throws SlotTakenError / PatientAlreadyBookedError on a clash. */
  add(appointment: Appointment, events: readonly TraceEvent[]): Promise<void>;
  /**
   * Saves an appointment whose version was bumped by the domain. Throws
   * AppointmentVersionConflictError if someone saved it in the meantime,
   * and the clash errors of `add` if it moved to a taken slot.
   */
  save(appointment: Appointment, events: readonly TraceEvent[]): Promise<void>;
}
