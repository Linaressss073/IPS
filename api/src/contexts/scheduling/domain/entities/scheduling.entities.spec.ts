import { colombiaDate, colombiaInstant, InvalidValueError, parseTime, TeamId } from '../../../../shared/domain/index.js';
import {
  InvalidAgendaError,
  InvalidAppointmentTransitionError,
  PastScheduleError,
  RescheduleServiceMismatchError,
  SlotNotInAgendaError,
} from '../errors/scheduling.errors.js';
import { Agenda } from './agenda.entity.js';
import { Appointment } from './appointment.entity.js';
import { CareLocation } from './care-location.entity.js';
import { MedicalService } from './medical-service.entity.js';

const teamId = TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY');
// 2026-10-02 07:00 in Colombia.
const now = new Date('2026-10-02T12:00:00Z');

const service = MedicalService.create({ teamId, code: ' rth ', name: 'Rehabilitación', now });
const otherService = MedicalService.create({ teamId, code: 'MG', name: 'Medicina general', now });
const location = CareLocation.create({ teamId, kind: 'consultorio', number: '502', now });

const openAgenda = (overrides: Partial<Parameters<typeof Agenda.open>[0]> = {}) =>
  Agenda.open({
    teamId,
    professionalId: 'user_doctor',
    serviceId: service.id,
    locationId: location.id,
    date: '2026-10-05',
    startTime: '07:00',
    endTime: '08:00',
    slotMinutes: 20,
    now,
    ...overrides,
  });

describe('Colombian time', () => {
  it('converts local dates and times (UTC-5, no daylight saving)', () => {
    expect(parseTime('07:30')).toBe(450);
    expect(colombiaInstant('2026-10-05', 450).toISOString()).toBe('2026-10-05T12:30:00.000Z');
    // 23:30 on the 1st in Colombia is already the 2nd in UTC.
    expect(colombiaDate(new Date('2026-10-02T04:30:00Z'))).toBe('2026-10-01');
    expect(() => parseTime('7:3')).toThrow(InvalidValueError);
    expect(() => parseTime('24:30')).toThrow(InvalidValueError);
  });
});

describe('Service and location', () => {
  it('normalizes the turn prefix and the location label', () => {
    expect(service.code.value).toBe('RTH');
    expect(location.label).toBe('Consultorio 502');
    expect(() => MedicalService.create({ teamId, code: 'R2', name: 'X y', now })).toThrow(
      InvalidValueError,
    );
  });
});

describe('Agenda', () => {
  it('splits the block into equal slots', () => {
    const agenda = openAgenda();
    expect(agenda.slots()).toEqual([420, 440, 460]);
    expect(agenda.hasSlot(440)).toBe(true);
    expect(agenda.hasSlot(450)).toBe(false);
    expect(agenda.hasSlot(480)).toBe(false);
  });

  it('rejects blocks that do not split, are inverted or in the past', () => {
    expect(() => openAgenda({ endTime: '08:10' })).toThrow(
      expect.objectContaining({ code: 'AGENDA_SLOTS_NOT_WHOLE', message: expect.stringContaining('end it at 08:00 or 08:20') }),
    );
    expect(() => openAgenda({ startTime: '09:00' })).toThrow(
      expect.objectContaining({ code: 'AGENDA_END_BEFORE_START' }),
    );
    expect(() => openAgenda({ slotMinutes: 3 })).toThrow(InvalidAgendaError);
    expect(() => openAgenda({ date: '2026-10-01' })).toThrow(PastScheduleError);
    expect(() => openAgenda({ date: '2026-02-30' })).toThrow(InvalidValueError);
  });
});

describe('Appointment', () => {
  const book = (time = '07:20') =>
    Appointment.schedule({ teamId, patientId: 'p1', agenda: openAgenda(), service, location, time, now });

  it('copies where, when and with whom from the agenda', () => {
    const appointment = book();
    expect(appointment.status).toBe('agendada');
    expect(appointment.slot).toMatchObject({
      professionalId: 'user_doctor',
      service: { code: 'RTH', name: 'Rehabilitación' },
      location: { label: 'Consultorio 502' },
      date: '2026-10-05',
      startMinute: 440,
      endMinute: 460,
    });
    expect(appointment.slot.startsAt.toISOString()).toBe('2026-10-05T12:20:00.000Z');
  });

  it('only books real slots in the future', () => {
    expect(() => book('07:10')).toThrow(SlotNotInAgendaError);
    const today = openAgenda({ date: '2026-10-02', startTime: '06:00', endTime: '08:00' });
    expect(() =>
      Appointment.schedule({ teamId, patientId: 'p1', agenda: today, service, location, time: '06:40', now }),
    ).toThrow(PastScheduleError);
  });

  it('confirms, cancels with a reason and refuses invalid steps', () => {
    const appointment = book();
    appointment.confirm(now);
    expect(appointment).toMatchObject({ status: 'confirmada', version: 2 });
    expect(() => appointment.confirm(now)).toThrow(InvalidAppointmentTransitionError);
    expect(() => appointment.cancel('x', now)).toThrow(InvalidValueError);
    appointment.cancel('El paciente viaja', now);
    expect(appointment).toMatchObject({ status: 'cancelada', active: false, cancelReason: 'El paciente viaja' });
    expect(() => appointment.cancel('Otra vez', now)).toThrow(InvalidAppointmentTransitionError);
  });

  it('reschedules within the same service and asks for confirmation again', () => {
    const appointment = book();
    appointment.confirm(now);
    const later = openAgenda({ date: '2026-10-06', professionalId: 'user_other' });
    const previous = appointment.reschedule({ agenda: later, service, location, time: '07:40', now });
    expect(previous.date).toBe('2026-10-05');
    expect(appointment).toMatchObject({ status: 'agendada', version: 3 });
    expect(appointment.slot).toMatchObject({ date: '2026-10-06', professionalId: 'user_other' });

    const otherAgenda = openAgenda({ serviceId: otherService.id });
    expect(() =>
      appointment.reschedule({ agenda: otherAgenda, service: otherService, location, time: '07:00', now }),
    ).toThrow(RescheduleServiceMismatchError);
  });
});
