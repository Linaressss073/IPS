import { TeamId } from '../../../../shared/domain/index.js';
import {
  AgendaView,
  AppointmentView,
  DayAgendaQuery,
  LocationView,
  SearchAppointmentsQuery,
  ServiceView,
} from '../types/scheduling.types.js';

/**
 * Port (read side): ready-to-render views. Names that live in other
 * contexts (patients, professionals) come back null; the queries fill them.
 */
export interface SchedulingReadModel {
  listServices(teamId: TeamId): Promise<ServiceView[]>;
  listLocations(teamId: TeamId): Promise<LocationView[]>;
  /** Agendas of the day with every slot and the appointment holding it. */
  dayAgendas(query: DayAgendaQuery): Promise<AgendaView[]>;
  searchAppointments(query: SearchAppointmentsQuery): Promise<AppointmentView[]>;
  /** Throws SchedulingNotFoundError('APPOINTMENT') if the team has no such appointment. */
  getAppointment(teamId: TeamId, appointmentId: string): Promise<AppointmentView>;
}
