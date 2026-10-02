import { TeamId } from '../../../../shared/domain/index.js';
import { Agenda } from '../../domain/entities/agenda.entity.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { CareLocation } from '../../domain/entities/care-location.entity.js';
import { MedicalService } from '../../domain/entities/medical-service.entity.js';
import { SchedulingId } from '../../domain/entities/scheduling-id.vo.js';
import { SchedulingNotFoundError } from '../errors/scheduling.errors.js';
import {
  AgendaRepository,
  AppointmentRepository,
  LocationRepository,
  ServiceRepository,
} from '../ports/scheduling.repositories.port.js';

/** Loads the team's aggregates by id, or fails with the matching 404. */
export class SchedulingFinder {
  constructor(
    private readonly services: ServiceRepository,
    private readonly locations: LocationRepository,
    private readonly agendas: AgendaRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  async service(teamId: TeamId, id: string): Promise<MedicalService> {
    const found = await this.services.findById(teamId, SchedulingId.of(id, 'serviceId'));
    if (!found) throw new SchedulingNotFoundError('SERVICE', id);
    return found;
  }

  async location(teamId: TeamId, id: string): Promise<CareLocation> {
    const found = await this.locations.findById(teamId, SchedulingId.of(id, 'locationId'));
    if (!found) throw new SchedulingNotFoundError('LOCATION', id);
    return found;
  }

  async agenda(teamId: TeamId, id: string): Promise<Agenda> {
    const found = await this.agendas.findById(teamId, SchedulingId.of(id, 'agendaId'));
    if (!found) throw new SchedulingNotFoundError('AGENDA', id);
    return found;
  }

  async appointment(teamId: TeamId, id: string): Promise<Appointment> {
    const found = await this.appointments.findById(teamId, SchedulingId.of(id, 'appointmentId'));
    if (!found) throw new SchedulingNotFoundError('APPOINTMENT', id);
    return found;
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
