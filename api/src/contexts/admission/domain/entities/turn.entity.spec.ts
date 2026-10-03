import { InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import {
  AppointmentNotAdmissibleError,
  InvalidTurnTransitionError,
  MaxCallsReachedError,
  NotTodayError,
} from '../errors/admission.errors.js';
import { CallSettings } from './call-settings.vo.js';
import { AppointmentSnapshot, Turn } from './turn.entity.js';

const teamId = TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY');
// 2026-10-05 07:00 in Colombia.
const now = new Date('2026-10-05T12:00:00Z');
const later = (seconds: number) => new Date(now.getTime() + seconds * 1000);

const appointment: AppointmentSnapshot = {
  id: '9b7e0000-0000-4000-8000-000000000001',
  status: 'confirmada',
  patientId: '12530000-0000-4000-8000-000000000001',
  professionalId: 'user_doctor',
  service: { id: 's1', code: 'RTH', name: 'Rehabilitación' },
  location: { id: 'l1', label: 'Consultorio 502' },
  date: '2026-10-05',
  time: '07:20',
};

const arrive = (overrides: Partial<AppointmentSnapshot> = {}) =>
  Turn.checkIn({ teamId, appointment: { ...appointment, ...overrides }, number: 4, now });

describe('CallSettings', () => {
  it('defaults to 3 calls every 2 minutes and validates its limits', () => {
    expect(CallSettings.DEFAULT.value).toEqual({ announceIntervalSeconds: 120, maxCalls: 3 });
    expect(() => CallSettings.of({ announceIntervalSeconds: 10, maxCalls: 3 })).toThrow(InvalidValueError);
    expect(() => CallSettings.of({ announceIntervalSeconds: 120, maxCalls: 9 })).toThrow(InvalidValueError);
  });
});

describe('Turn', () => {
  it('checks in only today, booked appointments, with the service prefix', () => {
    const turn = arrive();
    expect(turn).toMatchObject({ label: 'RTH 4', status: 'en_espera', calls: 0, version: 1 });
    expect(() => arrive({ date: '2026-10-06' })).toThrow(NotTodayError);
    expect(() => arrive({ status: 'cancelada' })).toThrow(AppointmentNotAdmissibleError);
  });

  it('is re-announced every interval and closed as a no-show after the last call', () => {
    const turn = arrive();
    const settings = CallSettings.DEFAULT;
    turn.call(settings, now);
    expect(turn).toMatchObject({ status: 'anunciado', calls: 1 });

    expect(turn.autoAdvance(settings, later(60))).toBe('none');
    expect(turn.autoAdvance(settings, later(120))).toBe('reannounced');
    expect(turn.autoAdvance(settings, later(240))).toBe('reannounced');
    expect(turn.calls).toBe(3);
    expect(turn.autoAdvance(settings, later(360))).toBe('no_show');
    expect(turn).toMatchObject({ status: 'no_se_presento', closedAt: later(360) });
  });

  it('can be called again by hand up to the limit, and attended without a call', () => {
    const settings = CallSettings.of({ announceIntervalSeconds: 60, maxCalls: 2 });
    const turn = arrive();
    turn.call(settings, now);
    turn.call(settings, later(10));
    expect(() => turn.call(settings, later(20))).toThrow(MaxCallsReachedError);

    const direct = arrive();
    direct.attend(now);
    expect(direct.status).toBe('atendido');
    expect(() => direct.call(settings, now)).toThrow(InvalidTurnTransitionError);
    expect(() => direct.markNoShow(now)).toThrow(InvalidTurnTransitionError);
  });
});
