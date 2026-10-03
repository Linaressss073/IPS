import { Actor, ActorInput, ActorResolver, Clock, TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { ClinicalNote, Diagnoses, Prescription, VitalSigns } from '../../domain/entities/clinical-record.vo.js';
import { Consultation, ConsultationChanges, ConsultationId } from '../../domain/entities/consultation.entity.js';
import {
  CONSULTATION_ADDENDUM_ADDED,
  CONSULTATION_SIGNED,
  CONSULTATION_STARTED,
} from '../constants/consultation.tokens.js';
import { ConsultationAlreadyStartedError, ConsultationVersionConflictError } from '../errors/consultation.errors.js';
import { consultationEvent } from '../mappings/consultation.mapper.js';
import { ConsultationAppointments, ConsultationRepository } from '../ports/consultation.ports.js';
import { ConsultationQueries } from '../queries/consultation.queries.js';
import { ConsultationView, UpdateConsultationCommand } from '../types/consultation.types.js';

/** The physician of the appointment opens its consultation (idempotent). */
export class StartConsultation {
  constructor(
    private readonly consultations: ConsultationRepository,
    private readonly appointments: ConsultationAppointments,
    private readonly queries: ConsultationQueries,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: { teamId: TeamId; appointmentId: string; actor: ActorInput }): Promise<ConsultationView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const appointment = await this.appointments.get(command.teamId, command.appointmentId);
    const now = this.clock.now();
    const consultation = Consultation.start({
      teamId: command.teamId,
      appointment,
      physicianId: actor.executedBy.value,
      now,
    });
    try {
      await this.consultations.add(consultation, [consultationEvent(consultation, CONSULTATION_STARTED, actor, now)]);
      return this.queries.get(command.teamId, consultation.id.value);
    } catch (error) {
      if (!(error instanceof ConsultationAlreadyStartedError)) throw error;
      // Started before (another tab, a double click): open that one.
      const existing = await this.consultations.getByAppointment(command.teamId, appointment.id);
      return this.queries.get(command.teamId, existing.id.value);
    }
  }
}

/** Loads at the version the client saw, applies the change and saves it. */
abstract class ChangeConsultation<C extends { teamId: TeamId; consultationId: string; expectedVersion: number; actor: ActorInput }> {
  constructor(
    protected readonly consultations: ConsultationRepository,
    private readonly queries: ConsultationQueries,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: C): Promise<ConsultationView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const consultation = await this.consultations.getById(command.teamId, ConsultationId.of(command.consultationId));
    if (consultation.version !== command.expectedVersion) {
      throw new ConsultationVersionConflictError(command.consultationId);
    }
    const now = this.clock.now();
    const events = this.change(consultation, command, actor, now);
    await this.consultations.save(consultation, events);
    return this.queries.get(command.teamId, consultation.id.value);
  }

  /** Applies the change; returns the trace events to store with it. */
  protected abstract change(consultation: Consultation, command: C, actor: Actor, now: Date): TraceEvent[];
}

/** Saves the draft (each group sent replaces the previous one). Not traced: it is a draft. */
export class UpdateConsultation extends ChangeConsultation<UpdateConsultationCommand> {
  protected change(consultation: Consultation, command: UpdateConsultationCommand, actor: Actor, now: Date) {
    const changes: ConsultationChanges = {
      note: command.note && ClinicalNote.of(command.note),
      vitals: command.vitals && VitalSigns.of(command.vitals),
      diagnoses: command.diagnoses && Diagnoses.of(command.diagnoses),
      prescription: command.prescription && Prescription.of(command.prescription),
    };
    consultation.update(actor.executedBy.value, changes, now);
    return [];
  }
}

export class SignConsultation extends ChangeConsultation<{
  teamId: TeamId;
  consultationId: string;
  expectedVersion: number;
  actor: ActorInput;
}> {
  protected change(consultation: Consultation, _: unknown, actor: Actor, now: Date) {
    consultation.sign(actor.executedBy.value, now);
    return [consultationEvent(consultation, CONSULTATION_SIGNED, actor, now)];
  }
}

export class AddAddendum extends ChangeConsultation<{
  teamId: TeamId;
  consultationId: string;
  expectedVersion: number;
  text: string;
  actor: ActorInput;
}> {
  protected change(consultation: Consultation, command: { text: string }, actor: Actor, now: Date) {
    consultation.addAddendum(actor.executedBy.value, command.text, now);
    return [consultationEvent(consultation, CONSULTATION_ADDENDUM_ADDED, actor, now)];
  }
}
