import {
  Actor,
  ActorResolver,
  Clock,
  newTraceEvent,
  TraceEvent,
} from '../../../../shared/application/index.js';
import { colombiaDate, UserId } from '../../../../shared/domain/index.js';
import { PHARMACY_SERVICE } from '../../domain/constants/admission.constants.js';
import { CallSettings } from '../../domain/entities/call-settings.vo.js';
import { Turn, TurnId } from '../../domain/entities/turn.entity.js';
import {
  CALL_SETTINGS_UPDATED,
  SYSTEM_USER,
  TURN_ATTENDED,
  TURN_CALLED,
  TURN_CHECKED_IN,
  TURN_NO_SHOW,
} from '../constants/admission.tokens.js';
import { TurnVersionConflictError } from '../errors/admission.errors.js';
import {
  AppointmentDirectory,
  CallSettingsRepository,
  TurnRepository,
} from '../ports/admission.ports.js';
import { GetTurn } from '../queries/admission.queries.js';
import {
  CallSettingsView,
  CheckInCommand,
  IssuePharmacyTurnCommand,
  TurnCommand,
  TurnView,
  UpdateCallSettingsCommand,
} from '../types/admission.types.js';

/** A step of the turn, traced in the patient's timeline. */
function turnEvent(turn: Turn, type: string, actor: Actor, occurredAt: Date, extra = {}): TraceEvent {
  return newTraceEvent({
    teamId: turn.teamId,
    patientId: turn.appointment.patientId,
    type,
    actor,
    occurredAt,
    data: {
      turnId: turn.id.value,
      label: turn.label,
      status: turn.status,
      calls: turn.calls,
      ...(turn.origin.kind === 'cita'
        ? { appointmentId: turn.appointment.id }
        : { consultationId: turn.origin.consultationId }),
      service: turn.appointment.service,
      location: turn.appointment.location,
      ...extra,
    },
  });
}

/**
 * The patient arrived for today's appointment: they get the next turn of
 * the service ("RTH 4") and wait to be called.
 */
export class CheckIn {
  constructor(
    private readonly turns: TurnRepository,
    private readonly appointments: AppointmentDirectory,
    private readonly getTurn: GetTurn,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: CheckInCommand): Promise<TurnView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const appointment = await this.appointments.get(command.teamId, command.appointmentId);
    const now = this.clock.now();
    const turn = await this.turns.checkIn(
      command.teamId,
      { date: colombiaDate(now), code: appointment.service.code },
      (number) => {
        const created = Turn.checkIn({ teamId: command.teamId, appointment, number, now });
        return { turn: created, events: [turnEvent(created, TURN_CHECKED_IN, actor, now)] };
      },
    );
    return this.getTurn.execute(command.teamId, turn.id.value);
  }
}

/**
 * Public command for the Pharmacy context: a patient with a signed
 * prescription gets the next "FAR n" turn at a pharmacy window.
 */
export class IssuePharmacyTurn {
  constructor(
    private readonly turns: TurnRepository,
    private readonly getTurn: GetTurn,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: IssuePharmacyTurnCommand): Promise<TurnView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const now = this.clock.now();
    const turn = await this.turns.checkIn(
      command.teamId,
      { date: colombiaDate(now), code: PHARMACY_SERVICE.code },
      (number) => {
        const created = Turn.issueForPharmacy({
          teamId: command.teamId,
          consultationId: command.consultationId,
          patientId: command.patientId,
          window: command.window,
          number,
          now,
        });
        return { turn: created, events: [turnEvent(created, TURN_CHECKED_IN, actor, now)] };
      },
    );
    return this.getTurn.execute(command.teamId, turn.id.value);
  }
}

/** Loads the turn at the version the client saw, changes it and saves it. */
abstract class ChangeTurn {
  constructor(
    protected readonly turns: TurnRepository,
    protected readonly settings: CallSettingsRepository,
    private readonly getTurn: GetTurn,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: TurnCommand): Promise<TurnView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const turn = await this.turns.getById(command.teamId, TurnId.of(command.turnId));
    if (turn.version !== command.expectedVersion) throw new TurnVersionConflictError(command.turnId);
    const now = this.clock.now();
    const type = await this.change(turn, now, command);
    await this.turns.save(turn, [turnEvent(turn, type, actor, now)]);
    return this.getTurn.execute(command.teamId, turn.id.value);
  }

  /** Applies the change and returns the trace event type. */
  protected abstract change(turn: Turn, now: Date, command: TurnCommand): Promise<string>;
}

/** Puts the turn on the waiting-room screen (or calls it again). */
export class CallTurn extends ChangeTurn {
  protected async change(turn: Turn, now: Date, command: TurnCommand) {
    turn.call(await this.settings.get(command.teamId), now);
    return TURN_CALLED;
  }
}

/** The professional received the patient: the turn is closed. */
export class AttendTurn extends ChangeTurn {
  protected async change(turn: Turn, now: Date) {
    turn.attend(now);
    return TURN_ATTENDED;
  }
}

/** Closed by hand as "no se presentó" (before the automatic last call). */
export class MarkNoShow extends ChangeTurn {
  protected async change(turn: Turn, now: Date) {
    turn.markNoShow(now);
    return TURN_NO_SHOW;
  }
}

/**
 * Run by the announcer every few seconds: re-announces called turns whose
 * interval passed and closes as "no se presentó" those past their last
 * call, each with its trace event by the system. A turn changed meanwhile
 * (attended, called by hand) is skipped and looked at again next time.
 */
export class AdvanceAnnouncements {
  private static readonly SYSTEM: Actor = {
    requestedBy: UserId.of(SYSTEM_USER),
    executedBy: UserId.of(SYSTEM_USER),
  };

  constructor(
    private readonly turns: TurnRepository,
    private readonly settings: CallSettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(now = this.clock.now()): Promise<{ reannounced: number; noShows: number }> {
    // The shortest interval any IPS may set: nothing more recent can be due.
    const candidates = await this.turns.findAnnouncedBefore(new Date(now.getTime() - 30_000));
    const settingsByTeam = new Map<string, CallSettings>();
    let reannounced = 0;
    let noShows = 0;
    for (const turn of candidates) {
      const teamKey = turn.teamId.value;
      if (!settingsByTeam.has(teamKey)) settingsByTeam.set(teamKey, await this.settings.get(turn.teamId));
      const result = turn.autoAdvance(settingsByTeam.get(teamKey)!, now);
      if (result === 'none') continue;
      try {
        await this.turns.save(turn, [
          turnEvent(turn, result === 'no_show' ? TURN_NO_SHOW : TURN_CALLED, AdvanceAnnouncements.SYSTEM, now, {
            automatic: true,
          }),
        ]);
      } catch (error) {
        if (error instanceof TurnVersionConflictError) continue;
        throw error;
      }
      if (result === 'no_show') noShows += 1;
      else reannounced += 1;
    }
    return { reannounced, noShows };
  }
}

/** How the IPS calls turns (administrators). */
export class UpdateCallSettings {
  constructor(
    private readonly settings: CallSettingsRepository,
    private readonly actors: ActorResolver,
    private readonly clock: Clock,
  ) {}

  async execute(command: UpdateCallSettingsCommand): Promise<CallSettingsView> {
    const actor = await this.actors.resolve(command.teamId, command.actor);
    const settings = CallSettings.of(command);
    await this.settings.save(command.teamId, settings, [
      newTraceEvent({
        teamId: command.teamId,
        patientId: null,
        type: CALL_SETTINGS_UPDATED,
        actor,
        occurredAt: this.clock.now(),
        data: { ...settings.value },
      }),
    ]);
    return { ...settings.value };
  }
}
