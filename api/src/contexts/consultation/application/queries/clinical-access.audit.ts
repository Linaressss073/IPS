import { Clock } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  ClinicalAccessEntry,
  ClinicalAccessLog,
  ConsultationNames,
  ConsultationReadModel,
} from '../ports/consultation.ports.js';
import { ClinicalAccessKind, ClinicalAccessView, ConsultationView } from '../types/consultation.types.js';

const LIST_LIMIT = 200;

/**
 * Records who opens clinical data (Resolución 1995 de 1999: the record is
 * reserved) and lets administrators read that log. A read that cannot be
 * logged fails: there is no access without a trace.
 */
export class ClinicalAccessAudit {
  constructor(
    private readonly log: ClinicalAccessLog,
    private readonly readModel: ConsultationReadModel,
    private readonly names: ConsultationNames,
    private readonly clock: Clock,
  ) {}

  /** The consultations a physician just opened. */
  consultations(teamId: TeamId, userId: string, views: readonly ConsultationView[]): Promise<void> {
    return this.record(
      teamId,
      views.map((view) => this.entry(userId, 'consulta', view.patient.id, view.id)),
    );
  }

  /** A patient's whole clinical history. */
  history(teamId: TeamId, userId: string, patientId: string): Promise<void> {
    return this.record(teamId, [this.entry(userId, 'historia', patientId, null)]);
  }

  /** A signed prescription (by the physician or the pharmacy). */
  async formula(teamId: TeamId, userId: string, consultationId: string): Promise<void> {
    const consultation = await this.readModel.getById(teamId, consultationId);
    await this.record(teamId, [this.entry(userId, 'formula', consultation.patient.id, consultationId)]);
  }

  async list(teamId: TeamId, patientId: string): Promise<ClinicalAccessView[]> {
    const entries = await this.log.list(teamId, patientId, LIST_LIMIT);
    const staff = await this.names.staff([...new Set(entries.map((e) => e.userId))]);
    return entries.map((e) => ({
      userId: e.userId,
      displayName: staff.get(e.userId) ?? '',
      kind: e.kind,
      consultationId: e.consultationId,
      at: e.at.toISOString(),
    }));
  }

  private entry(
    userId: string,
    kind: ClinicalAccessKind,
    patientId: string,
    consultationId: string | null,
  ): ClinicalAccessEntry {
    return { userId, kind, patientId, consultationId, at: this.clock.now() };
  }

  private async record(teamId: TeamId, entries: readonly ClinicalAccessEntry[]): Promise<void> {
    if (entries.length > 0) await this.log.record(teamId, entries);
  }
}
