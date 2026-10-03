import { parseCalendarDate, TeamId } from '../../../../shared/domain/index.js';
import { ConsultationId } from '../../domain/entities/consultation.entity.js';
import { ConsultationReadModel } from '../ports/consultation.ports.js';
import { PrescriptionView } from '../types/consultation.types.js';

/**
 * Public queries for the Pharmacy context: signed prescriptions only. The
 * clinical note, vital signs and diagnoses are never part of the answer.
 */
export class PrescriptionQueries {
  constructor(private readonly readModel: ConsultationReadModel) {}

  list(teamId: TeamId, filter: { date?: string; patientId?: string }): Promise<PrescriptionView[]> {
    return this.readModel.prescriptions(teamId, {
      date: filter.date ? parseCalendarDate(filter.date) : undefined,
      patientId: filter.patientId,
    });
  }

  get(teamId: TeamId, consultationId: string): Promise<PrescriptionView> {
    return this.readModel.prescription(teamId, ConsultationId.of(consultationId).value);
  }
}
