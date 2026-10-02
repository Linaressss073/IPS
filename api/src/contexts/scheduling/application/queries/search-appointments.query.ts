import { InvalidValueError } from '../../../../shared/domain/index.js';
import { APPOINTMENT_STATUSES } from '../../domain/constants/scheduling.constants.js';
import { AppointmentStatus } from '../../domain/types/scheduling.types.js';
import { parseCalendarDate } from '../../domain/utils/colombia-time.js';
import { SchedulingReadModel } from '../ports/scheduling-read-model.port.js';
import { NameResolver } from '../services/name-resolver.service.js';
import { AppointmentView, SearchAppointmentsQuery } from '../types/scheduling.types.js';

/** Appointments of a day, a patient or a professional, in time order. */
export class SearchAppointments {
  constructor(
    private readonly readModel: SchedulingReadModel,
    private readonly names: NameResolver,
  ) {}

  async execute(query: SearchAppointmentsQuery): Promise<AppointmentView[]> {
    if (!query.date && !query.patientId && !query.professionalId) {
      throw new InvalidValueError('Filter by date, patientId or professionalId');
    }
    if (query.status && !APPOINTMENT_STATUSES.includes(query.status as AppointmentStatus)) {
      throw new InvalidValueError(`status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`);
    }
    const views = await this.readModel.searchAppointments({
      ...query,
      date: query.date ? parseCalendarDate(query.date) : undefined,
    });
    return this.names.appointments(query.teamId, views);
  }
}
