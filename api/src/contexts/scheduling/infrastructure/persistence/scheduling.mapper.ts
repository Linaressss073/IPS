import { normalizeForSearch, TeamId } from '../../../../shared/domain/index.js';
import { Agenda } from '../../domain/entities/agenda.entity.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { CareLocation } from '../../domain/entities/care-location.entity.js';
import { MedicalService } from '../../domain/entities/medical-service.entity.js';
import { SchedulingId } from '../../domain/entities/scheduling-id.vo.js';
import { ServiceCode } from '../../domain/entities/service-code.vo.js';
import {
  AgendaDocument,
  AppointmentDocument,
  LocationDocument,
  ServiceDocument,
} from './scheduling.documents.js';

/** Aggregates <-> documents. Restoring re-runs no rules. */
export const SchedulingMapper = {
  serviceToDocument(service: MedicalService): ServiceDocument {
    return {
      _id: service.id.value,
      teamId: service.teamId.value,
      code: service.code.value,
      name: service.name,
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  },

  serviceToDomain(doc: ServiceDocument): MedicalService {
    return MedicalService.restore(SchedulingId.of(doc._id), {
      teamId: TeamId.of(doc.teamId),
      code: ServiceCode.of(doc.code),
      name: doc.name,
      active: doc.active,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  },

  locationToDocument(location: CareLocation): LocationDocument {
    return {
      _id: location.id.value,
      teamId: location.teamId.value,
      kind: location.kind,
      number: location.number,
      key: `${normalizeForSearch(location.kind)}/${location.number.toUpperCase()}`,
      active: location.active,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  },

  locationToDomain(doc: LocationDocument): CareLocation {
    return CareLocation.restore(SchedulingId.of(doc._id), {
      teamId: TeamId.of(doc.teamId),
      kind: doc.kind,
      number: doc.number,
      active: doc.active,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  },

  agendaToDocument(agenda: Agenda): AgendaDocument {
    return {
      _id: agenda.id.value,
      teamId: agenda.teamId.value,
      professionalId: agenda.professionalId,
      serviceId: agenda.serviceId.value,
      locationId: agenda.locationId.value,
      date: agenda.date,
      startMinute: agenda.startMinute,
      endMinute: agenda.endMinute,
      slotMinutes: agenda.slotMinutes,
      createdAt: agenda.createdAt,
    };
  },

  agendaToDomain(doc: AgendaDocument): Agenda {
    return Agenda.restore(SchedulingId.of(doc._id), {
      teamId: TeamId.of(doc.teamId),
      professionalId: doc.professionalId,
      serviceId: SchedulingId.of(doc.serviceId),
      locationId: SchedulingId.of(doc.locationId),
      date: doc.date,
      startMinute: doc.startMinute,
      endMinute: doc.endMinute,
      slotMinutes: doc.slotMinutes,
      createdAt: doc.createdAt,
    });
  },

  appointmentToDocument(appointment: Appointment): AppointmentDocument {
    const { slot } = appointment;
    return {
      _id: appointment.id.value,
      teamId: appointment.teamId.value,
      patientId: appointment.patientId,
      agendaId: slot.agendaId.value,
      professionalId: slot.professionalId,
      service: { ...slot.service },
      location: { ...slot.location },
      date: slot.date,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      startsAt: slot.startsAt,
      status: appointment.status,
      active: appointment.active,
      cancelReason: appointment.cancelReason,
      version: appointment.version,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  },

  appointmentToDomain(doc: AppointmentDocument): Appointment {
    return Appointment.restore(SchedulingId.of(doc._id), {
      teamId: TeamId.of(doc.teamId),
      patientId: doc.patientId,
      slot: {
        agendaId: SchedulingId.of(doc.agendaId),
        professionalId: doc.professionalId,
        service: doc.service,
        location: doc.location,
        date: doc.date,
        startMinute: doc.startMinute,
        endMinute: doc.endMinute,
        startsAt: doc.startsAt,
      },
      status: doc.status,
      cancelReason: doc.cancelReason,
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  },
};
