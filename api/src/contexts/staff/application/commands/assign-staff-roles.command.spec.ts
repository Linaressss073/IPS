import { Clock, TraceEvent } from '../../../../shared/application/index.js';
import {
  InvalidValueError,
  TeamId,
  UserId,
} from '../../../../shared/domain/index.js';
import { permissionsFor } from '../../domain/constants/permissions.js';
import { StaffRoles } from '../../domain/entities/staff-roles.vo.js';
import { StaffMemberNotFoundError } from '../errors/staff.errors.js';
import { StaffReadModel } from '../ports/staff-read-model.port.js';
import { StaffRepository } from '../ports/staff.repository.port.js';
import { AssignStaffRoles } from './assign-staff-roles.command.js';

const teamId = TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY');
const clock: Clock = { now: () => new Date('2026-10-02T12:00:00Z') };
const admin = UserId.of('user_admin');

describe('Permissions matrix', () => {
  it('gives each role only what the project agreed', () => {
    expect(permissionsFor({ isAdmin: false, roles: [] })).toEqual([]);
    expect(permissionsFor({ isAdmin: false, roles: ['medico'] })).toEqual([
      'patients:read',
      'appointments:read',
      'turns:call',
    ]);
    expect(permissionsFor({ isAdmin: false, roles: ['agendamiento', 'admision'] })).toEqual([
      'patients:read',
      'patients:write',
      'appointments:read',
      'appointments:manage',
      'admission:manage',
      'turns:call',
    ]);
    // Administrators manage everything except calling turns (not in their column).
    expect(permissionsFor({ isAdmin: true, roles: [] })).toEqual([
      'patients:read',
      'patients:write',
      'appointments:read',
      'appointments:manage',
      'admission:manage',
      'settings:manage',
      'staff:manage',
    ]);
  });

  it('normalizes and validates role names', () => {
    expect(StaffRoles.of([' Medico ', 'admision', 'medico']).value).toEqual([
      'admision',
      'medico',
    ]);
    expect(() => StaffRoles.of(['administrador'])).toThrow(InvalidValueError);
  });
});

describe('AssignStaffRoles', () => {
  let roles: Map<string, string[]>;
  let events: TraceEvent[];
  let assign: AssignStaffRoles;

  beforeEach(() => {
    roles = new Map();
    events = [];
    const repo = {
      ensureMembership: async (_team: TeamId, userId: string) => {
        if (!roles.has(userId)) roles.set(userId, []);
      },
      setRoles: async (_team: TeamId, userId: string, next: readonly string[], traced: readonly TraceEvent[]) => {
        roles.set(userId, [...next]);
        events.push(...traced);
      },
    } as unknown as StaffRepository;
    const readModel = {
      rolesOf: async (_team: TeamId, userId: string) => roles.get(userId) ?? [],
      getMember: async (_team: TeamId, userId: string) => ({
        userId,
        displayName: null,
        emailMasked: null,
        providerRole: 'org:member',
        roles: roles.get(userId) ?? [],
      }),
    } as unknown as StaffReadModel;
    const members = {
      isMember: async (userId: UserId) => userId.value === 'user_nurse',
      roleIn: async () => 'member',
    };
    assign = new AssignStaffRoles(repo, readModel, members, clock);
  });

  const run = (userId: string, next: string[]) =>
    assign.execute({ teamId, userId, roles: next, actor: { requestedBy: admin, executedBy: admin } });

  it('sets the roles and traces who changed what', async () => {
    const member = await run('user_nurse', ['admision', 'agendamiento']);
    expect(member.roles).toEqual(['agendamiento', 'admision']);
    expect(events).toEqual([
      expect.objectContaining({
        type: 'staff.roles_assigned',
        patientId: null,
        executedBy: 'user_admin',
        data: { userId: 'user_nurse', from: [], to: ['agendamiento', 'admision'] },
      }),
    ]);

    // Same roles again: nothing new is traced.
    await run('user_nurse', ['agendamiento', 'admision']);
    expect(events).toHaveLength(1);
  });

  it('rejects users who are not members of the IPS', async () => {
    await expect(run('user_stranger', ['medico'])).rejects.toThrow(StaffMemberNotFoundError);
  });
});
