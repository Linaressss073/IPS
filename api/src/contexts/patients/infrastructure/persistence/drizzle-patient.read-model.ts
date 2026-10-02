import { and, asc, count, eq, like, SQL } from 'drizzle-orm';
import { TeamId } from '../../../../shared/domain/index.js';
import { Database } from '../../../../shared/infrastructure/persistence/database.module.js';
import { PatientReadModel } from '../../application/ports/patient-read-model.port.js';
import { Page, PatientView } from '../../application/types/patient.types.js';
import { PatientMapper } from './patient.mapper.js';
import { patients } from './patient.schema.js';
import { escapeLike, normalizeForSearch } from './search-text.js';

/** Read side over the patients table: rows go straight to views. */
export class DrizzlePatientReadModel implements PatientReadModel {
  constructor(private readonly db: Database) {}

  async findById(
    teamId: TeamId,
    patientId: string,
  ): Promise<PatientView | null> {
    const [row] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.teamId, teamId.value), eq(patients.id, patientId)))
      .limit(1);
    return row ? PatientMapper.toView(row) : null;
  }

  /** Every word of `q` must appear in the document number or the names. */
  async search(params: {
    teamId: TeamId;
    q: string;
    page: number;
    pageSize: number;
  }): Promise<Page<PatientView>> {
    const words = normalizeForSearch(params.q).split(' ').filter(Boolean);
    const where: SQL | undefined = and(
      eq(patients.teamId, params.teamId.value),
      ...words.map((word) =>
        like(patients.searchText, `%${escapeLike(word)}%`),
      ),
    );

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(patients)
        .where(where)
        .orderBy(
          asc(patients.firstLastName),
          asc(patients.firstName),
          asc(patients.id),
        )
        .limit(params.pageSize)
        .offset((params.page - 1) * params.pageSize),
      this.db.select({ total: count() }).from(patients).where(where),
    ]);

    return {
      items: rows.map((row) => PatientMapper.toView(row)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
