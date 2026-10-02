import { TeamId } from '../../../../shared/domain/index.js';
import { PatientDirectory, Professionals } from '../ports/other-contexts.port.js';
import { AgendaView, AppointmentView } from '../types/scheduling.types.js';

/**
 * Fills the names that belong to other contexts when the views are read,
 * so a corrected patient name or an anonymized professional shows right.
 */
export class NameResolver {
  constructor(
    private readonly patients: PatientDirectory,
    private readonly professionals: Professionals,
  ) {}

  async appointments(teamId: TeamId, views: AppointmentView[]): Promise<AppointmentView[]> {
    const [patients, names] = await Promise.all([
      this.patients.summaries(teamId, views.map((v) => v.patient.id)),
      this.professionals.namesFor(views.map((v) => v.professional.userId)),
    ]);
    return views.map((view) => {
      const patient = patients.get(view.patient.id);
      return {
        ...view,
        patient: {
          id: view.patient.id,
          fullName: patient?.fullName ?? null,
          document: patient?.document ?? null,
        },
        professional: {
          userId: view.professional.userId,
          displayName: names.get(view.professional.userId) ?? null,
        },
      };
    });
  }

  async agendas(teamId: TeamId, views: AgendaView[]): Promise<AgendaView[]> {
    const patientIds = views.flatMap((agenda) =>
      agenda.slots.flatMap((slot) => (slot.appointment ? [slot.appointment.patient.id] : [])),
    );
    const [patients, names] = await Promise.all([
      this.patients.summaries(teamId, patientIds),
      this.professionals.namesFor(views.map((v) => v.professional.userId)),
    ]);
    return views.map((agenda) => ({
      ...agenda,
      professional: {
        userId: agenda.professional.userId,
        displayName: names.get(agenda.professional.userId) ?? null,
      },
      slots: agenda.slots.map((slot) =>
        slot.appointment
          ? {
              ...slot,
              appointment: {
                ...slot.appointment,
                patient: {
                  id: slot.appointment.patient.id,
                  fullName: patients.get(slot.appointment.patient.id)?.fullName ?? null,
                },
              },
            }
          : slot,
      ),
    }));
  }
}
