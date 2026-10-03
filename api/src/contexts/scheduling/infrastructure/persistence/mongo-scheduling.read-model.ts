import type { Db, Filter } from 'mongodb';
import { colombiaInstant, formatTime, TeamId } from '../../../../shared/domain/index.js';
import { SchedulingNotFoundError } from '../../application/errors/scheduling.errors.js';
import { SchedulingReadModel } from '../../application/ports/scheduling-read-model.port.js';
import {
  AgendaView,
  AppointmentView,
  DayAgendaQuery,
  LocationView,
  SearchAppointmentsQuery,
  ServiceView,
} from '../../application/types/scheduling.types.js';
import {
  AGENDAS_COLLECTION,
  AgendaDocument,
  APPOINTMENTS_COLLECTION,
  AppointmentDocument,
  LOCATIONS_COLLECTION,
  LocationDocument,
  SERVICES_COLLECTION,
  ServiceDocument,
} from './scheduling.documents.js';

const MAX_APPOINTMENTS = 500;

/** Documents straight to views; names of other contexts stay null. */
export class MongoSchedulingReadModel implements SchedulingReadModel {
  constructor(private readonly db: Db) {}

  async listServices(teamId: TeamId): Promise<ServiceView[]> {
    const docs = await this.db
      .collection<ServiceDocument>(SERVICES_COLLECTION)
      .find({ teamId: teamId.value })
      .sort({ name: 1 })
      .toArray();
    return docs.map((doc) => ({ id: doc._id, code: doc.code, name: doc.name, active: doc.active }));
  }

  async listLocations(teamId: TeamId): Promise<LocationView[]> {
    const docs = await this.db
      .collection<LocationDocument>(LOCATIONS_COLLECTION)
      .find({ teamId: teamId.value })
      .sort({ kind: 1, number: 1 })
      .toArray();
    return docs.map((doc) => ({
      id: doc._id,
      kind: doc.kind,
      number: doc.number,
      label: `${doc.kind} ${doc.number}`,
      active: doc.active,
    }));
  }

  async dayAgendas(query: DayAgendaQuery): Promise<AgendaView[]> {
    const teamId = query.teamId.value;
    const agendas = await this.db
      .collection<AgendaDocument>(AGENDAS_COLLECTION)
      .find({
        teamId,
        date: query.date,
        ...(query.professionalId && { professionalId: query.professionalId }),
        ...(query.serviceId && { serviceId: query.serviceId }),
      })
      .sort({ startMinute: 1, _id: 1 })
      .toArray();
    if (agendas.length === 0) return [];

    const [services, locations, appointments] = await Promise.all([
      this.db
        .collection<ServiceDocument>(SERVICES_COLLECTION)
        .find({ teamId, _id: { $in: agendas.map((a) => a.serviceId) } })
        .toArray(),
      this.db
        .collection<LocationDocument>(LOCATIONS_COLLECTION)
        .find({ teamId, _id: { $in: agendas.map((a) => a.locationId) } })
        .toArray(),
      this.db
        .collection<AppointmentDocument>(APPOINTMENTS_COLLECTION)
        .find({ teamId, agendaId: { $in: agendas.map((a) => a._id) }, active: true })
        .toArray(),
    ]);

    return agendas.map((agenda) => {
      const service = services.find((s) => s._id === agenda.serviceId);
      const location = locations.find((l) => l._id === agenda.locationId);
      const slots = [];
      for (let m = agenda.startMinute; m < agenda.endMinute; m += agenda.slotMinutes) {
        const booked = appointments.find((a) => a.agendaId === agenda._id && a.startMinute === m);
        slots.push({
          time: formatTime(m),
          startsAt: colombiaInstant(agenda.date, m).toISOString(),
          appointment: booked
            ? { id: booked._id, status: booked.status, patient: { id: booked.patientId, fullName: null } }
            : null,
        });
      }
      return {
        id: agenda._id,
        date: agenda.date,
        startTime: formatTime(agenda.startMinute),
        endTime: formatTime(agenda.endMinute),
        slotMinutes: agenda.slotMinutes,
        professional: { userId: agenda.professionalId, displayName: null },
        service: {
          id: agenda.serviceId,
          code: service?.code ?? '',
          name: service?.name ?? '',
        },
        location: {
          id: agenda.locationId,
          label: location ? `${location.kind} ${location.number}` : '',
        },
        slots,
      };
    });
  }

  async searchAppointments(query: SearchAppointmentsQuery): Promise<AppointmentView[]> {
    const filter: Filter<AppointmentDocument> = {
      teamId: query.teamId.value,
      ...(query.date && { date: query.date }),
      ...(query.patientId && { patientId: query.patientId }),
      ...(query.professionalId && { professionalId: query.professionalId }),
      ...(query.status && { status: query.status as AppointmentDocument['status'] }),
    };
    const docs = await this.db
      .collection<AppointmentDocument>(APPOINTMENTS_COLLECTION)
      .find(filter)
      .sort({ startsAt: 1, createdAt: 1, _id: 1 })
      .limit(MAX_APPOINTMENTS)
      .toArray();
    return docs.map(toAppointmentView);
  }

  async getAppointment(teamId: TeamId, appointmentId: string): Promise<AppointmentView> {
    const doc = await this.db
      .collection<AppointmentDocument>(APPOINTMENTS_COLLECTION)
      .findOne({ _id: appointmentId, teamId: teamId.value });
    if (!doc) throw new SchedulingNotFoundError('APPOINTMENT', appointmentId);
    return toAppointmentView(doc);
  }
}

function toAppointmentView(doc: AppointmentDocument): AppointmentView {
  return {
    id: doc._id,
    status: doc.status,
    patient: { id: doc.patientId, fullName: null, document: null },
    professional: { userId: doc.professionalId, displayName: null },
    service: doc.service,
    location: doc.location,
    agendaId: doc.agendaId,
    date: doc.date,
    time: formatTime(doc.startMinute),
    endTime: formatTime(doc.endMinute),
    startsAt: doc.startsAt.toISOString(),
    cancelReason: doc.cancelReason,
    version: doc.version,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
