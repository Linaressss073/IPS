import type { Collection, Db, MongoClient } from 'mongodb';
import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import {
  inTransaction,
  isDuplicateKey,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { appendTraceEvents } from '../../../../shared/infrastructure/persistence/trace-event.writer.js';
import {
  AlreadyCheckedInError,
  TurnNotFoundError,
  TurnVersionConflictError,
} from '../../application/errors/admission.errors.js';
import {
  CallSettingsRepository,
  TurnReadModel,
  TurnRepository,
} from '../../application/ports/admission.ports.js';
import { ListTurnsQuery, TurnView } from '../../application/types/admission.types.js';
import { CallSettings, CallSettingsProps } from '../../domain/entities/call-settings.vo.js';
import { AppointmentSnapshot, Turn, TurnId } from '../../domain/entities/turn.entity.js';
import { TurnStatus } from '../../domain/types/admission.types.js';

export const TURNS_COLLECTION = 'admission_turns';
export const TURN_COUNTERS_COLLECTION = 'admission_turn_counters';
export const CALL_SETTINGS_COLLECTION = 'admission_settings';

export interface TurnDocument {
  _id: string;
  teamId: string;
  /** Colombian date of the appointment (= arrival day). */
  date: string;
  number: number;
  label: string;
  appointment: AppointmentSnapshot;
  status: TurnStatus;
  calls: number;
  lastCalledAt: Date | null;
  arrivedAt: Date;
  closedAt: Date | null;
  version: number;
}

/** Next number per IPS, day and service prefix: `${teamId}/${date}/${code}`. */
interface CounterDocument {
  _id: string;
  value: number;
}

interface SettingsDocument extends CallSettingsProps {
  _id: string;
  updatedAt: Date;
}

export async function ensureAdmissionIndexes(db: Db): Promise<void> {
  await db.collection(TURNS_COLLECTION).createIndexes([
    // One turn per appointment, even with two simultaneous check-ins.
    { key: { 'appointment.id': 1 }, name: 'appointment_uq', unique: true },
    { key: { teamId: 1, date: 1, arrivedAt: 1 }, name: 'team_date' },
    { key: { teamId: 1, date: 1, lastCalledAt: -1 }, name: 'team_date_called' },
    { key: { status: 1, lastCalledAt: 1 }, name: 'announced_due' },
  ]);
}

function toDocument(turn: Turn): TurnDocument {
  return {
    _id: turn.id.value,
    teamId: turn.teamId.value,
    date: turn.appointment.date,
    number: turn.number,
    label: turn.label,
    appointment: turn.appointment,
    status: turn.status,
    calls: turn.calls,
    lastCalledAt: turn.lastCalledAt,
    arrivedAt: turn.arrivedAt,
    closedAt: turn.closedAt,
    version: turn.version,
  };
}

function toDomain(doc: TurnDocument): Turn {
  return Turn.restore(TurnId.of(doc._id), {
    teamId: TeamId.of(doc.teamId),
    appointment: doc.appointment,
    number: doc.number,
    status: doc.status,
    calls: doc.calls,
    lastCalledAt: doc.lastCalledAt,
    arrivedAt: doc.arrivedAt,
    closedAt: doc.closedAt,
    version: doc.version,
  });
}

export class MongoTurnRepository implements TurnRepository {
  private readonly turns: Collection<TurnDocument>;

  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {
    this.turns = db.collection<TurnDocument>(TURNS_COLLECTION);
  }

  async getById(teamId: TeamId, id: TurnId): Promise<Turn> {
    const doc = await this.turns.findOne({ _id: id.value, teamId: teamId.value });
    if (!doc) throw new TurnNotFoundError(id.value);
    return toDomain(doc);
  }

  async checkIn(
    teamId: TeamId,
    numbering: { date: string; code: string },
    build: (number: number) => { turn: Turn; events: TraceEvent[] },
  ): Promise<Turn> {
    try {
      return await inTransaction(this.client, async (session) => {
        const counter = await this.db
          .collection<CounterDocument>(TURN_COUNTERS_COLLECTION)
          .findOneAndUpdate(
            { _id: `${teamId.value}/${numbering.date}/${numbering.code}` },
            { $inc: { value: 1 } },
            { upsert: true, returnDocument: 'after', session },
          );
        const { turn, events } = build(counter!.value);
        await this.turns.insertOne(toDocument(turn), { session });
        await appendTraceEvents(this.db, events, session);
        return turn;
      });
    } catch (error) {
      // The transaction (and the number taken) rolls back.
      if (isDuplicateKey(error)) throw new AlreadyCheckedInError();
      throw error;
    }
  }

  /** Optimistic locking: the stored turn must hold the previous version. */
  async save(turn: Turn, events: readonly TraceEvent[]): Promise<void> {
    const { _id, teamId, ...fields } = toDocument(turn);
    await inTransaction(this.client, async (session) => {
      const result = await this.turns.updateOne(
        { _id, teamId, version: turn.version - 1 },
        { $set: fields },
        { session },
      );
      if (result.matchedCount === 0) throw new TurnVersionConflictError(_id);
      await appendTraceEvents(this.db, events, session);
    });
  }

  async findAnnouncedBefore(calledBefore: Date): Promise<Turn[]> {
    const docs = await this.turns
      .find({ status: 'anunciado', lastCalledAt: { $lte: calledBefore } })
      .limit(500)
      .toArray();
    return docs.map(toDomain);
  }
}

export class MongoCallSettingsRepository implements CallSettingsRepository {
  constructor(
    private readonly client: MongoClient,
    private readonly db: Db,
  ) {}

  async get(teamId: TeamId): Promise<CallSettings> {
    const doc = await this.db
      .collection<SettingsDocument>(CALL_SETTINGS_COLLECTION)
      .findOne({ _id: teamId.value });
    return doc
      ? CallSettings.of({ announceIntervalSeconds: doc.announceIntervalSeconds, maxCalls: doc.maxCalls })
      : CallSettings.DEFAULT;
  }

  async save(teamId: TeamId, settings: CallSettings, events: readonly TraceEvent[]): Promise<void> {
    await inTransaction(this.client, async (session) => {
      await this.db
        .collection<SettingsDocument>(CALL_SETTINGS_COLLECTION)
        .updateOne(
          { _id: teamId.value },
          { $set: { ...settings.value, updatedAt: new Date() } },
          { upsert: true, session },
        );
      await appendTraceEvents(this.db, events, session);
    });
  }
}

export class MongoTurnReadModel implements TurnReadModel {
  private readonly turns: Collection<TurnDocument>;

  constructor(db: Db) {
    this.turns = db.collection<TurnDocument>(TURNS_COLLECTION);
  }

  async getById(teamId: TeamId, turnId: string): Promise<TurnView> {
    const doc = await this.turns.findOne({ _id: turnId, teamId: teamId.value });
    if (!doc) throw new TurnNotFoundError(turnId);
    return toView(doc);
  }

  async list(query: ListTurnsQuery & { date: string }): Promise<TurnView[]> {
    const docs = await this.turns
      .find({
        teamId: query.teamId.value,
        date: query.date,
        ...(query.status && { status: query.status as TurnStatus }),
        ...(query.professionalId && { 'appointment.professionalId': query.professionalId }),
      })
      .sort({ arrivedAt: 1, _id: 1 })
      .limit(1000)
      .toArray();
    return docs.map(toView);
  }

  async calledOn(teamId: TeamId, date: string, limit: number): Promise<TurnView[]> {
    const docs = await this.turns
      .find({ teamId: teamId.value, date, lastCalledAt: { $ne: null } })
      .sort({ lastCalledAt: -1, _id: 1 })
      .limit(limit)
      .toArray();
    return docs.map(toView);
  }
}

function toView(doc: TurnDocument): TurnView {
  return {
    id: doc._id,
    label: doc.label,
    code: doc.appointment.service.code,
    number: doc.number,
    status: doc.status,
    calls: doc.calls,
    lastCalledAt: doc.lastCalledAt?.toISOString() ?? null,
    arrivedAt: doc.arrivedAt.toISOString(),
    closedAt: doc.closedAt?.toISOString() ?? null,
    date: doc.date,
    appointment: { id: doc.appointment.id, time: doc.appointment.time },
    patient: { id: doc.appointment.patientId, fullName: null, shortName: null, document: null },
    professional: { userId: doc.appointment.professionalId, displayName: null },
    service: doc.appointment.service,
    location: doc.appointment.location,
    version: doc.version,
  };
}
