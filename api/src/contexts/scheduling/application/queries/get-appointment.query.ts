import { TeamId } from '../../../../shared/domain/index.js';
import { SchedulingId } from '../../domain/entities/scheduling-id.vo.js';
import { SchedulingNotFoundError } from '../errors/scheduling.errors.js';
import { SchedulingReadModel } from '../ports/scheduling-read-model.port.js';
import { NameResolver } from '../services/name-resolver.service.js';
import { AppointmentView } from '../types/scheduling.types.js';

export class GetAppointment {
  constructor(
    private readonly readModel: SchedulingReadModel,
    private readonly names: NameResolver,
  ) {}

  async execute(teamId: TeamId, appointmentId: string): Promise<AppointmentView> {
    const id = SchedulingId.of(appointmentId, 'appointmentId').value;
    const view = await this.readModel.findAppointment(teamId, id);
    if (!view) throw new SchedulingNotFoundError('APPOINTMENT', id);
    const [named] = await this.names.appointments(teamId, [view]);
    return named;
  }
}
