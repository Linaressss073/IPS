import { TeamId } from '../../../../shared/domain/index.js';
import { ProfessionalView } from '../types/scheduling.types.js';

/** Port to the Patients context: who the patients are (never their aggregate). */
export interface PatientDirectory {
  summaries(
    teamId: TeamId,
    patientIds: readonly string[],
  ): Promise<Map<string, { fullName: string; document: { type: string; number: string } }>>;
}

/** Port to the Staff context: members with the "medico" role, and names. */
export interface Professionals {
  list(teamId: TeamId): Promise<ProfessionalView[]>;
  namesFor(userIds: readonly string[]): Promise<Map<string, string>>;
}
