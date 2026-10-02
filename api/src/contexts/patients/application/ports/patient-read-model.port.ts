import { TeamId } from '../../../../shared/domain/index.js';
import { Page, PatientSummaryView, PatientView } from '../types/patient.types.js';

/** Port (read side): ready-to-render patient data, no domain rules involved. */
export interface PatientReadModel {
  findById(teamId: TeamId, patientId: string): Promise<PatientView | null>;

  /** Summaries of the given patients of the team, by id (unknown ids are absent). */
  summaries(teamId: TeamId, patientIds: string[]): Promise<Map<string, PatientSummaryView>>;

  /** An empty `q` lists every patient of the team. */
  search(params: {
    teamId: TeamId;
    q: string;
    page: number;
    pageSize: number;
  }): Promise<Page<PatientView>>;
}
