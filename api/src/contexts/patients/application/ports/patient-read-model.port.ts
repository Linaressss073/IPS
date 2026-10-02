import { TeamId } from '../../../../shared/domain/index.js';
import { Page, PatientView } from '../types/patient.types.js';

/** Port (read side): ready-to-render patient data, no domain rules involved. */
export interface PatientReadModel {
  findById(teamId: TeamId, patientId: string): Promise<PatientView | null>;

  /** An empty `q` lists every patient of the team. */
  search(params: {
    teamId: TeamId;
    q: string;
    page: number;
    pageSize: number;
  }): Promise<Page<PatientView>>;
}
