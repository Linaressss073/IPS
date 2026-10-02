import { TeamId } from '../../../../shared/domain/index.js';
import { PatientReadModel } from '../ports/patient-read-model.port.js';
import { PatientSummaryView } from '../types/patient.types.js';

/**
 * Public query for other contexts (e.g. scheduling): name and document of
 * the given patients of the team, read when shown so edits are reflected.
 */
export class GetPatientSummaries {
  constructor(private readonly readModel: PatientReadModel) {}

  execute(teamId: TeamId, patientIds: readonly string[]): Promise<Map<string, PatientSummaryView>> {
    return this.readModel.summaries(teamId, [...new Set(patientIds)]);
  }
}
