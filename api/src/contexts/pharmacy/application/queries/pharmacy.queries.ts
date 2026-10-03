import { colombiaDate, InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import { Clock } from '../../../../shared/application/index.js';
import { DISPENSATION_STATUSES } from '../../domain/constants/pharmacy.constants.js';
import { Dispensation } from '../../domain/entities/dispensation.entity.js';
import { DispensationStatus } from '../../domain/types/pharmacy.types.js';
import {
  DispensationRepository,
  PharmacyNames,
  PrescriptionSource,
  SourcePrescription,
} from '../ports/pharmacy.ports.js';
import { PharmacyPrescriptionView } from '../types/pharmacy.types.js';

/**
 * The pharmacy's worklist: signed prescriptions (of a day, or of a
 * patient) with what was delivered of each and what is pending.
 */
export class PharmacyQueries {
  constructor(
    private readonly prescriptions: PrescriptionSource,
    private readonly dispensations: DispensationRepository,
    private readonly names: PharmacyNames,
    private readonly clock: Clock,
  ) {}

  async list(
    teamId: TeamId,
    filter: { date?: string; patientId?: string; status?: string },
  ): Promise<PharmacyPrescriptionView[]> {
    if (filter.status && !DISPENSATION_STATUSES.includes(filter.status as DispensationStatus)) {
      throw new InvalidValueError(`status must be one of: ${DISPENSATION_STATUSES.join(', ')}`);
    }
    const prescriptions = await this.prescriptions.list(teamId, {
      // A patient's prescriptions are searched on any day; otherwise, today's.
      date: filter.patientId ? filter.date : (filter.date ?? colombiaDate(this.clock.now())),
      patientId: filter.patientId,
    });
    const views = await this.toViews(teamId, prescriptions);
    return filter.status ? views.filter((view) => view.status === filter.status) : views;
  }

  async get(teamId: TeamId, consultationId: string): Promise<PharmacyPrescriptionView> {
    const [view] = await this.toViews(teamId, [await this.prescriptions.get(teamId, consultationId)]);
    return view;
  }

  private async toViews(teamId: TeamId, prescriptions: SourcePrescription[]): Promise<PharmacyPrescriptionView[]> {
    const dispensations = await this.dispensations.findMany(
      teamId,
      prescriptions.map((p) => p.consultationId),
    );
    const [patients, staff] = await Promise.all([
      this.names.patients(teamId, prescriptions.map((p) => p.patientId)),
      this.names.staff([
        ...prescriptions.map((p) => p.physicianId),
        ...dispensations.flatMap((d) => d.deliveries.map((delivery) => delivery.by)),
      ]),
    ]);
    return prescriptions.map((p) =>
      toView(p, dispensations.filter((d) => d.consultationId === p.consultationId), patients, staff),
    );
  }
}

/** `dispensation`: the prescription's dispensation, if any delivery happened (0 or 1). */
function toView(
  prescription: SourcePrescription,
  dispensation: Dispensation[],
  patients: Awaited<ReturnType<PharmacyNames['patients']>>,
  staff: Map<string, string>,
): PharmacyPrescriptionView {
  const delivered = (index: number) => dispensation[0]?.items[index]?.delivered ?? 0;
  const items = prescription.items.map((item, index) => ({
    index,
    medication: item.medication,
    presentation: item.presentation,
    dose: item.dose,
    route: item.route,
    frequency: item.frequency,
    durationDays: item.durationDays,
    instructions: item.instructions,
    prescribed: item.quantity,
    delivered: delivered(index),
    pending: item.quantity - delivered(index),
  }));
  return {
    consultationId: prescription.consultationId,
    patient: { id: prescription.patientId, ...(patients.get(prescription.patientId) ?? { fullName: '', document: { type: '', number: '' } }) },
    physician: { userId: prescription.physicianId, displayName: staff.get(prescription.physicianId) ?? '' },
    date: prescription.date,
    signedAt: prescription.signedAt,
    status: dispensation[0]?.status ?? 'pendiente',
    items,
    deliveries: (dispensation[0]?.deliveries ?? []).map((delivery) => ({
      at: delivery.at.toISOString(),
      by: delivery.by,
      byName: staff.get(delivery.by) ?? '',
      lines: delivery.lines.map((line) => ({
        index: line.index,
        medication: prescription.items[line.index]?.medication ?? '',
        quantity: line.quantity,
      })),
      note: delivery.note,
    })),
    version: dispensation[0]?.version ?? 0,
  };
}
