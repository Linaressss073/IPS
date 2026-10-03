import { Clock } from '../../../../shared/application/index.js';
import { TeamId, UserId } from '../../../../shared/domain/index.js';
import { InMemoryPatientRepository } from '../../infrastructure/persistence/in-memory-patient.repository.fake.js';
import {
  DocumentAlreadyRegisteredError,
  PatientNotFoundError,
  PatientVersionConflictError,
  RequesterNotATeamMemberError,
} from '../errors/patient.errors.js';
import { ActorResolver } from '../../../../shared/application/index.js';
import { PatientInput } from '../types/patient.types.js';
import { RecordCompanion } from './record-companion.command.js';
import { RegisterPatient } from './register-patient.command.js';
import { UpdatePatient } from './update-patient.command.js';

const teamA = TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY');
const teamB = TeamId.of('org_2xTeamB3gHj7KlP0qWeR5tYuI');
const admission = UserId.of('admission-user');
const doctor = UserId.of('doctor-user');
const outsider = UserId.of('outsider-user');
const clock: Clock = { now: () => new Date('2026-10-01T12:00:00Z') };

// admission and doctor work at team A; outsider does not.
const members = {
  isMember: async (userId: UserId, teamId: TeamId) =>
    teamId.equals(teamA) && !userId.equals(outsider),
};

const input: PatientInput = {
  document: { type: 'CC', number: '1000123456' },
  name: { firstName: 'Andrés', firstLastName: 'Gómez' },
  birthDate: '1990-05-20',
  sex: 'H',
  contact: { email: 'andres@example.com' },
  affiliation: { eps: 'Sanitas', regime: 'contributivo' },
};

describe('Patient commands', () => {
  let repo: InMemoryPatientRepository;
  let register: RegisterPatient;
  let update: UpdatePatient;
  let recordCompanion: RecordCompanion;

  beforeEach(() => {
    repo = new InMemoryPatientRepository();
    const actors = new ActorResolver(members);
    register = new RegisterPatient(repo, actors, clock);
    update = new UpdatePatient(repo, actors, clock);
    recordCompanion = new RecordCompanion(repo, actors, clock);
  });

  const registerIn = (teamId: TeamId) =>
    register.execute({ ...input, teamId, actor: { executedBy: admission } });

  it('registers a patient and traces who requested and executed it', async () => {
    const view = await register.execute({
      ...input,
      teamId: teamA,
      actor: { executedBy: admission, requestedBy: doctor },
    });

    expect(view).toMatchObject({
      document: { type: 'CC', number: '1000123456' },
      fullName: 'Andrés Gómez',
      version: 1,
      registeredAt: '2026-10-01T12:00:00.000Z',
    });
    expect(repo.events).toEqual([
      expect.objectContaining({
        teamId: teamA.value,
        patientId: view.id,
        type: 'patient.registered',
        requestedBy: 'doctor-user',
        executedBy: 'admission-user',
      }),
    ]);
  });

  it('uses the executor as requester when none is given', async () => {
    await registerIn(teamA);
    expect(repo.events[0]).toMatchObject({
      requestedBy: 'admission-user',
      executedBy: 'admission-user',
    });
  });

  it('rejects a requester who is not a member of the team', async () => {
    await expect(
      register.execute({
        ...input,
        teamId: teamA,
        actor: { executedBy: admission, requestedBy: outsider },
      }),
    ).rejects.toThrow(RequesterNotATeamMemberError);
    expect(repo.rows.size).toBe(0);
  });

  it('rejects the same document twice within a team, not across teams', async () => {
    await registerIn(teamA);
    await expect(registerIn(teamA)).rejects.toThrow(
      DocumentAlreadyRegisteredError,
    );
    await expect(registerIn(teamB)).resolves.toBeDefined();
  });

  it('updates, traces the changed fields and bumps the version', async () => {
    const { id } = await registerIn(teamA);
    const view = await update.execute({
      teamId: teamA,
      patientId: id,
      expectedVersion: 1,
      changes: {
        contact: { email: 'andres@example.com', phone: '3001234567' },
      },
      actor: { executedBy: admission, requestedBy: doctor },
    });

    expect(view.version).toBe(2);
    expect(view.contact.phone).toBe('3001234567');
    expect(repo.events[1]).toMatchObject({
      type: 'patient.updated',
      requestedBy: 'doctor-user',
      executedBy: 'admission-user',
      data: {
        changes: [
          {
            field: 'contact',
            from: { email: 'andres@example.com', phone: null, address: null },
            to: {
              email: 'andres@example.com',
              phone: '3001234567',
              address: null,
            },
          },
        ],
      },
    });
  });

  it('neither saves nor traces an update that changes nothing', async () => {
    const { id } = await registerIn(teamA);
    const view = await update.execute({
      teamId: teamA,
      patientId: id,
      expectedVersion: 1,
      changes: { sex: 'h' },
      actor: { executedBy: admission },
    });
    expect(view.version).toBe(1);
    expect(repo.events).toHaveLength(1);
  });

  it('rejects an update based on a stale version', async () => {
    const { id } = await registerIn(teamA);
    const changeEmail = (email: string) =>
      update.execute({
        teamId: teamA,
        patientId: id,
        expectedVersion: 1,
        changes: { contact: { email } },
        actor: { executedBy: admission },
      });

    await changeEmail('first@example.com');
    await expect(changeEmail('second@example.com')).rejects.toThrow(
      PatientVersionConflictError,
    );
  });

  it('rejects changing the document to one already registered', async () => {
    const { id } = await registerIn(teamA);
    await register.execute({
      ...input,
      document: { type: 'CC', number: '52000111' },
      teamId: teamA,
      actor: { executedBy: admission },
    });

    await expect(
      update.execute({
        teamId: teamA,
        patientId: id,
        expectedVersion: 1,
        changes: { document: { type: 'CC', number: '52.000.111' } },
        actor: { executedBy: admission },
      }),
    ).rejects.toThrow(DocumentAlreadyRegisteredError);
  });

  it('never exposes a patient of another team', async () => {
    const { id } = await registerIn(teamA);
    await expect(
      update.execute({
        teamId: teamB,
        patientId: id,
        expectedVersion: 1,
        changes: { sex: 'M' },
        actor: { executedBy: admission },
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });

  it('records the first companion as #1 together with the registration', async () => {
    const { id } = await register.execute({
      ...input,
      teamId: teamA,
      actor: { executedBy: admission },
      companion: { name: { firstName: 'María', firstLastName: 'Torres' } },
    });

    expect(repo.events.map((e) => e.type)).toEqual([
      'patient.registered',
      'patient.companion_recorded',
    ]);
    expect(repo.events[1]).toMatchObject({
      patientId: id,
      data: { number: 1, name: { firstName: 'María' } },
    });
  });

  it('numbers each new companion after the previous ones', async () => {
    const { id } = await registerIn(teamA);
    const add = (phone: string) =>
      recordCompanion.execute({
        teamId: teamA,
        patientId: id,
        companion: { phone, relationship: 'cuidador' },
        actor: { executedBy: admission, requestedBy: doctor },
      });

    expect((await add('3001111111')).number).toBe(1);
    const second = await add('3002222222');
    expect(second).toMatchObject({
      number: 2,
      phone: '3002222222',
      relationship: 'cuidador',
      requestedBy: 'doctor-user',
      executedBy: 'admission-user',
    });
    // Recording a companion is not a change of the patient's data.
    expect((await update.execute({
      teamId: teamA,
      patientId: id,
      expectedVersion: 1,
      changes: { sex: 'M' },
      actor: { executedBy: admission },
    })).version).toBe(2);
  });

  it('records companions only for patients of the same team', async () => {
    const { id } = await registerIn(teamA);
    await expect(
      recordCompanion.execute({
        teamId: teamB,
        patientId: id,
        companion: { phone: '3001111111' },
        actor: { executedBy: admission },
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });
});
