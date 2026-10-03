import { TeamId } from '../../../../shared/domain/index.js';
import { Agenda } from '../../domain/entities/agenda.entity.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { CareLocation } from '../../domain/entities/care-location.entity.js';
import { MedicalService } from '../../domain/entities/medical-service.entity.js';
import { SchedulingId } from '../../domain/entities/scheduling-id.vo.js';
import {
  AgendaRepository,
  AppointmentRepository,
  LocationRepository,
  ServiceRepository,
} from '../ports/scheduling.repositories.port.js';

/** Loads the team's aggregates by id (string ids are parsed; unknown ones are a 404). */
export class SchedulingFinder {
  constructor(
    private readonly services: ServiceRepository,
    private readonly locations: LocationRepository,
    private readonly agendas: AgendaRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  async service(teamId: TeamId, id: string): Promise<MedicalService> {
    return this.services.getById(teamId, SchedulingId.of(id, 'serviceId'));
  }

  async location(teamId: TeamId, id: string): Promise<CareLocation> {
    return this.locations.getById(teamId, SchedulingId.of(id, 'locationId'));
  }

  async agenda(teamId: TeamId, id: string): Promise<Agenda> {
    return this.agendas.getById(teamId, SchedulingId.of(id, 'agendaId'));
  }

  async appointment(teamId: TeamId, id: string): Promise<Appointment> {
    return this.appointments.getById(teamId, SchedulingId.of(id, 'appointmentId'));
  }

  /** The agenda with its service and location, as needed to book a slot. */
  async bookable(teamId: TeamId, agendaId: string) {
    const agenda = await this.agenda(teamId, agendaId);
    const [service, location] = await Promise.all([
      this.service(teamId, agenda.serviceId.value),
      this.location(teamId, agenda.locationId.value),
    ]);
    return { agenda, service, location };
  }
}
