import type { Collection, Db, MongoClient } from 'mongodb';
import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  inTransaction,
  isDuplicateKey,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { appendTraceEvents } from '../../../../shared/infrastructure/persistence/trace-event.writer.js';
import {
  AgendaOverlapError,
  AppointmentVersionConflictError,
  LocationTakenError,
  PatientAlreadyBookedError,
  SchedulingNotFoundError,
  ServiceCodeTakenError,
  SlotTakenError,
} from '../../application/errors/scheduling.errors.js';
import {
  AgendaRepository,
  AppointmentRepository,
  LocationRepository,
  ServiceRepository,
} from '../../application/ports/scheduling.repositories.port.js';
import { Agenda } from '../../domain/entities/agenda.entity.js';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { CareLocation } from '../../domain/entities/care-location.entity.js';
import { MedicalService } from '../../domain/entities/medical-service.entity.js';
import { SchedulingId } from '../../domain/entities/scheduling-id.vo.js';
import {
  AGENDAS_COLLECTION,
  AgendaDocument,
  APPOINTMENTS_COLLECTION,
  AppointmentDocument,
  LOCATIONS_COLLECTION,
  LocationDocument,
  PATIENT_TIME_INDEX,
  SERVICES_COLLECTION,
  ServiceDocument,
} from './scheduling.documents.js';
import { SchedulingMapper } from './scheduling.mapper.js';

/** Each write stores the aggregate and its trace events in one transaction. */
abstract class MongoRepository {
  constructor(
    protected readonly client: MongoClient,
    protected readonly db: Db,
  ) {}

  protected write(
    events: readonly TraceEvent[],
    change: (session: import('mongodb').ClientSession) => Promise<void>,
  ): Promise<void> {
    return inTransaction(this.client, async (session) => {
      await change(session);
      await appendTraceEvents(this.db, events, session);
    });
  }
}

export class MongoServiceRepository extends MongoRepository implements ServiceRepository {
  private get services(): Collection<ServiceDocument> {
    return this.db.collection<ServiceDocument>(SERVICES_COLLECTION);
  }

  async getById(teamId: TeamId, id: SchedulingId): Promise<MedicalService> {
    const doc = await this.services.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new SchedulingNotFoundError('SERVICE', id.value);
    return SchedulingMapper.serviceToDomain(doc);
  }

  async add(service: MedicalService, events: readonly TraceEvent[]): Promise<void> {
    try {
      await this.write(events, async (session) => {
        await this.services.insertOne(SchedulingMapper.serviceToDocument(service), { session });
      });
    } catch (error) {
      if (isDuplicateKey(error)) throw new ServiceCodeTakenError(service.code.value);
      throw error;
    }
  }

  async save(service: MedicalService, events: readonly TraceEvent[]): Promise<void> {
    const { _id, teamId, ...fields } = SchedulingMapper.serviceToDocument(service);
    await this.write(events, async (session) => {
      await this.services.updateOne({ _id, teamId }, { $set: fields }, { session });
    });
  }
}

export class MongoLocationRepository extends MongoRepository implements LocationRepository {
  private get locations(): Collection<LocationDocument> {
    return this.db.collection<LocationDocument>(LOCATIONS_COLLECTION);
  }

  async getById(teamId: TeamId, id: SchedulingId): Promise<CareLocation> {
    const doc = await this.locations.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new SchedulingNotFoundError('LOCATION', id.value);
    return SchedulingMapper.locationToDomain(doc);
  }

  async add(location: CareLocation, events: readonly TraceEvent[]): Promise<void> {
    try {
      await this.write(events, async (session) => {
        await this.locations.insertOne(SchedulingMapper.locationToDocument(location), { session });
      });
    } catch (error) {
      if (isDuplicateKey(error)) throw new LocationTakenError(location.label);
      throw error;
    }
  }

  async save(location: CareLocation, events: readonly TraceEvent[]): Promise<void> {
    const { _id, teamId, ...fields } = SchedulingMapper.locationToDocument(location);
    await this.write(events, async (session) => {
      await this.locations.updateOne({ _id, teamId }, { $set: fields }, { session });
    });
  }
}

export class MongoAgendaRepository extends MongoRepository implements AgendaRepository {
  private get agendas(): Collection<AgendaDocument> {
    return this.db.collection<AgendaDocument>(AGENDAS_COLLECTION);
  }

  async getById(teamId: TeamId, id: SchedulingId): Promise<Agenda> {
    const doc = await this.agendas.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new SchedulingNotFoundError('AGENDA', id.value);
    return SchedulingMapper.agendaToDomain(doc);
  }

  async assertNoOverlap(agenda: Agenda): Promise<void> {
    const clash = await this.agendas.findOne({
      teamId: agenda.teamId.value,
      date: agenda.date,
      startMinute: { $lt: agenda.endMinute },
      endMinute: { $gt: agenda.startMinute },
      $or: [{ professionalId: agenda.professionalId }, { locationId: agenda.locationId.value }],
    });
    if (clash) {
      throw new AgendaOverlapError(clash.professionalId === agenda.professionalId ? 'professional' : 'location');
    }
  }

  async add(agenda: Agenda, events: readonly TraceEvent[]): Promise<void> {
    await this.write(events, async (session) => {
      await this.agendas.insertOne(SchedulingMapper.agendaToDocument(agenda), { session });
    });
  }

  async remove(agenda: Agenda, events: readonly TraceEvent[]): Promise<void> {
    await this.write(events, async (session) => {
      await this.agendas.deleteOne(
        { _id: agenda.id.value, teamId: agenda.teamId.value },
        { session },
      );
    });
  }
}

export class MongoAppointmentRepository extends MongoRepository implements AppointmentRepository {
  private get appointments(): Collection<AppointmentDocument> {
    return this.db.collection<AppointmentDocument>(APPOINTMENTS_COLLECTION);
  }

  async getById(teamId: TeamId, id: SchedulingId): Promise<Appointment> {
    const doc = await this.appointments.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new SchedulingNotFoundError('APPOINTMENT', id.value);
    return SchedulingMapper.appointmentToDomain(doc);
  }

  countActiveIn(teamId: TeamId, agendaId: SchedulingId): Promise<number> {
    return this.appointments.countDocuments({
      teamId: teamId.value,
      agendaId: agendaId.value,
      active: true,
    });
  }

  async add(appointment: Appointment, events: readonly TraceEvent[]): Promise<void> {
    await withClashGuard(() =>
      this.write(events, async (session) => {
        await this.appointments.insertOne(SchedulingMapper.appointmentToDocument(appointment), {
          session,
        });
      }),
    );
  }

  /** Optimistic locking: the stored document must hold the previous version. */
  async save(appointment: Appointment, events: readonly TraceEvent[]): Promise<void> {
    const { _id, teamId, ...fields } = SchedulingMapper.appointmentToDocument(appointment);
    await withClashGuard(() =>
      this.write(events, async (session) => {
        const result = await this.appointments.updateOne(
          { _id, teamId, version: appointment.version - 1 },
          { $set: fields },
          { session },
        );
        if (result.matchedCount === 0) throw new AppointmentVersionConflictError(_id);
      }),
    );
  }
}

/** The unique indexes decide simultaneous bookings; translate their verdict. */
async function withClashGuard(write: () => Promise<void>): Promise<void> {
  try {
    await write();
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    if ((error as Error).message.includes(PATIENT_TIME_INDEX)) {
      throw new PatientAlreadyBookedError();
    }
    throw new SlotTakenError();
  }
}
