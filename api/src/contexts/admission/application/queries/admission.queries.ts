import {
  colombiaDate,
  InvalidValueError,
  parseCalendarDate,
  TeamId,
} from '../../../../shared/domain/index.js';
import { Clock } from '../../../../shared/application/index.js';
import { TURN_STATUSES } from '../../domain/constants/admission.constants.js';
import { TurnId } from '../../domain/entities/turn.entity.js';
import { TurnStatus } from '../../domain/types/admission.types.js';
import {
  AdmissionPatients,
  AdmissionStaffNames,
  CallSettingsRepository,
  TurnReadModel,
} from '../ports/admission.ports.js';
import {
  BoardCall,
  BoardView,
  CallSettingsView,
  ListTurnsQuery,
  TurnView,
} from '../types/admission.types.js';

/** Calls shown on the side of the waiting-room screen. */
const RECENT_CALLS = 6;

/** Fills patient and professional names, read when shown. */
export class TurnNames {
  constructor(
    private readonly patients: AdmissionPatients,
    private readonly staff: AdmissionStaffNames,
  ) {}

  async fill(teamId: TeamId, views: TurnView[]): Promise<TurnView[]> {
    const [patients, names] = await Promise.all([
      this.patients.summaries(teamId, views.map((v) => v.patient.id)),
      this.staff.namesFor(views.map((v) => v.professional.userId)),
    ]);
    return views.map((view) => {
      const patient = patients.get(view.patient.id);
      return {
        ...view,
        patient: {
          id: view.patient.id,
          fullName: patient?.fullName ?? null,
          shortName: patient?.shortName ?? null,
          document: patient?.document ?? null,
        },
        professional: {
          userId: view.professional.userId,
          displayName: names.get(view.professional.userId) ?? null,
        },
      };
    });
  }
}

/** Today's (or a given day's) turns, in arrival order. */
export class ListTurns {
  constructor(
    private readonly readModel: TurnReadModel,
    private readonly names: TurnNames,
    private readonly clock: Clock,
  ) {}

  async execute(query: ListTurnsQuery): Promise<TurnView[]> {
    if (query.status && !TURN_STATUSES.includes(query.status as TurnStatus)) {
      throw new InvalidValueError(`status must be one of: ${TURN_STATUSES.join(', ')}`);
    }
    const date = query.date ? parseCalendarDate(query.date) : colombiaDate(this.clock.now());
    return this.names.fill(query.teamId, await this.readModel.list({ ...query, date }));
  }
}

export class GetTurn {
  constructor(
    private readonly readModel: TurnReadModel,
    private readonly names: TurnNames,
  ) {}

  async execute(teamId: TeamId, turnId: string): Promise<TurnView> {
    const id = TurnId.of(turnId).value;
    const view = await this.readModel.getById(teamId, id);
    const [named] = await this.names.fill(teamId, [view]);
    return named;
  }
}

/**
 * The waiting-room screen: the turn being announced, large, and the last
 * calls on the side. Only the turn, the place and the patient's name and
 * first last name: nothing else about the patient.
 */
export class GetBoard {
  constructor(
    private readonly readModel: TurnReadModel,
    private readonly names: TurnNames,
    private readonly settings: CallSettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(teamId: TeamId): Promise<BoardView> {
    const date = colombiaDate(this.clock.now());
    const [called, settings] = await Promise.all([
      this.readModel.calledOn(teamId, date, RECENT_CALLS + 1),
      this.settings.get(teamId),
    ]);
    const calls: BoardCall[] = (await this.names.fill(teamId, called)).map((view) => ({
      turnId: view.id,
      label: view.label,
      location: view.location.label,
      patientName: view.patient.shortName,
      status: view.status,
      calls: view.calls,
      calledAt: view.lastCalledAt!,
    }));
    const currentIndex = calls.findIndex((call) => call.status === 'anunciado');
    const current = currentIndex >= 0 ? calls[currentIndex] : null;
    return {
      current,
      recent: calls.filter((_, index) => index !== currentIndex).slice(0, RECENT_CALLS),
      settings: { ...settings.value },
    };
  }
}

export class GetCallSettings {
  constructor(private readonly settings: CallSettingsRepository) {}

  async execute(teamId: TeamId): Promise<CallSettingsView> {
    return { ...(await this.settings.get(teamId)).value };
  }
}
