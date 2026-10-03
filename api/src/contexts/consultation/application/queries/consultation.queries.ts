import { TeamId } from '../../../../shared/domain/index.js';
import { ConsultationId } from '../../domain/entities/consultation.entity.js';
import { ConsultationNames, ConsultationReadModel } from '../ports/consultation.ports.js';
import { ConsultationView } from '../types/consultation.types.js';

export class ConsultationQueries {
  constructor(
    private readonly readModel: ConsultationReadModel,
    private readonly names: ConsultationNames,
  ) {}

  async get(teamId: TeamId, consultationId: string): Promise<ConsultationView> {
    const view = await this.readModel.getById(teamId, ConsultationId.of(consultationId).value);
    const [named] = await this.fill(teamId, [view]);
    return named;
  }

  /** A patient's clinical history (newest first) or the consultation of an appointment. */
  async list(teamId: TeamId, filter: { patientId?: string; appointmentId?: string }): Promise<ConsultationView[]> {
    return this.fill(teamId, await this.readModel.list(teamId, filter));
  }

  private async fill(teamId: TeamId, views: ConsultationView[]): Promise<ConsultationView[]> {
    const [patients, staff] = await Promise.all([
      this.names.patients(teamId, views.map((v) => v.patient.id)),
      this.names.staff(views.flatMap((v) => [v.physician.userId, ...v.addenda.map((a) => a.writtenBy)])),
    ]);
    return views.map((view) => ({
      ...view,
      patient: { id: view.patient.id, ...(patients.get(view.patient.id) ?? view.patient) },
      physician: { userId: view.physician.userId, displayName: staff.get(view.physician.userId) ?? '' },
      addenda: view.addenda.map((a) => ({ ...a, writtenByName: staff.get(a.writtenBy) ?? '' })),
    }));
  }
}
