import { PatientReadModel } from '../ports/patient-read-model.port.js';
import {
  Page,
  PatientView,
  SearchPatientsQuery,
} from '../types/patient.types.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Finds patients of a team by document number or name, paginated. */
export class SearchPatients {
  constructor(private readonly readModel: PatientReadModel) {}

  execute(query: SearchPatientsQuery): Promise<Page<PatientView>> {
    return this.readModel.search({
      teamId: query.teamId,
      q: query.q?.trim() ?? '',
      page: Math.max(1, query.page ?? 1),
      pageSize: Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
      ),
    });
  }
}
