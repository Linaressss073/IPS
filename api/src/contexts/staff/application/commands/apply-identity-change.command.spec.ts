import { Clock } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { StaffProfile } from '../../domain/entities/staff-profile.vo.js';
import { StaffProjection } from '../ports/staff-projection.port.js';
import { StaffRepository } from '../ports/staff.repository.port.js';
import { ApplyIdentityChange } from './apply-identity-change.command.js';

const teamId = TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY');
const clock: Clock = { now: () => new Date('2026-10-02T12:00:00Z') };
const profile = StaffProfile.of({
  userId: 'user_ana',
  firstName: 'Ana',
  email: 'ana@clinica.com.co',
  sourceUpdatedAt: new Date(1),
});

describe('ApplyIdentityChange', () => {
  let calls: string[];
  let refreshed: string[][];
  let apply: ApplyIdentityChange;

  beforeEach(() => {
    calls = [];
    refreshed = [];
    const repo: StaffRepository = {
      saveProfile: async (p, options) => {
        calls.push(`saveProfile:${p.userId}:${options?.onlyIfMissing ? 'ifMissing' : 'upsert'}`);
      },
      anonymize: async (userId) => {
        calls.push(`anonymize:${userId}`);
      },
      saveMembership: async (m) => {
        calls.push(`saveMembership:${m.userId}`);
      },
      removeMembership: async (_teamId, userId) => {
        calls.push(`removeMembership:${userId}`);
      },
      removeTeam: async () => {
        calls.push('removeTeam');
        return ['user_ana', 'user_luis'];
      },
    };
    const projection: StaffProjection = {
      refresh: async (ids) => {
        refreshed.push([...ids]);
      },
      rebuildAll: async () => 0,
    };
    apply = new ApplyIdentityChange(repo, projection, clock);
  });

  it('refreshes the Mongo copy of every user a change touched', async () => {
    await apply.execute({ kind: 'user.upserted', profile });
    await apply.execute({
      kind: 'membership.upserted',
      teamId,
      userId: 'user_ana',
      providerRole: 'org:member',
      sourceUpdatedAt: new Date(2),
      profile,
    });
    await apply.execute({ kind: 'user.deleted', userId: 'user_ana' });
    await apply.execute({ kind: 'team.deleted', teamId });

    expect(calls).toEqual([
      'saveProfile:user_ana:upsert',
      'saveProfile:user_ana:ifMissing',
      'saveMembership:user_ana',
      'anonymize:user_ana',
      'removeTeam',
    ]);
    expect(refreshed).toEqual([
      ['user_ana'],
      ['user_ana'],
      ['user_ana'],
      ['user_ana', 'user_luis'],
    ]);
  });
});
