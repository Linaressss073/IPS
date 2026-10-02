import { ActorInput } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';

// Commands (write side)

export interface CreateServiceCommand {
  teamId: TeamId;
  code: string;
  name: string;
  actor: ActorInput;
}

export interface UpdateServiceCommand {
  teamId: TeamId;
  serviceId: string;
  name?: string;
  active?: boolean;
  actor: ActorInput;
}

export interface CreateLocationCommand {
  teamId: TeamId;
  kind: string;
  number: string;
  actor: ActorInput;
}

export interface UpdateLocationCommand {
  teamId: TeamId;
  locationId: string;
  active: boolean;
  actor: ActorInput;
}

export interface OpenAgendaCommand {
  teamId: TeamId;
  professionalId: string;
  serviceId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  actor: ActorInput;
}

export interface DeleteAgendaCommand {
  teamId: TeamId;
  agendaId: string;
  actor: ActorInput;
}

export interface ScheduleAppointmentCommand {
  teamId: TeamId;
  patientId: string;
  agendaId: string;
  /** Start of the slot, "HH:MM" (Colombia). */
  time: string;
  actor: ActorInput;
}

export interface ChangeAppointmentCommand {
  teamId: TeamId;
  appointmentId: string;
  /** The version the client read; a stale one is rejected (409). */
  expectedVersion: number;
  actor: ActorInput;
}

export interface CancelAppointmentCommand extends ChangeAppointmentCommand {
  reason: string;
}

export interface RescheduleAppointmentCommand extends ChangeAppointmentCommand {
  agendaId: string;
  time: string;
}

// Queries (read side)

export interface DayAgendaQuery {
  teamId: TeamId;
  date: string;
  professionalId?: string;
  serviceId?: string;
}

export interface SearchAppointmentsQuery {
  teamId: TeamId;
  date?: string;
  patientId?: string;
  professionalId?: string;
  status?: string;
}

// Read models

export interface ServiceView {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface LocationView {
  id: string;
  kind: string;
  number: string;
  label: string;
  active: boolean;
}

export interface ProfessionalView {
  userId: string;
  displayName: string | null;
}

export interface SlotView {
  time: string;
  startsAt: string;
  /** The active appointment holding the slot, if any. */
  appointment: {
    id: string;
    status: string;
    patient: { id: string; fullName: string | null };
  } | null;
}

export interface AgendaView {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  professional: ProfessionalView;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  slots: SlotView[];
}

export interface AppointmentView {
  id: string;
  status: string;
  patient: {
    id: string;
    fullName: string | null;
    document: { type: string; number: string } | null;
  };
  professional: ProfessionalView;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  agendaId: string;
  date: string;
  time: string;
  endTime: string;
  startsAt: string;
  cancelReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
