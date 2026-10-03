import { Clock } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { StaffProfile } from '../../domain/entities/staff-profile.vo.js';
import { IdentitySource } from '../ports/identity-source.port.js';
import { StaffRepository, StoredStaffUser } from '../ports/staff.repository.port.js';
import { IdentityChange } from '../types/staff.types.js';
import { ApplyIdentityChange } from './apply-identity-change.command.js';
import { SyncStaffFromProvider } from './sync-staff-from-provider.command.js';

const TEAM = 'org_2xTeamA9fKq4LmN8pRsT1uVwY';
const startedAt = new Date('2026-10-02T12:00:00Z');
const before = new Date('2026-10-01T00:00:00Z');
const after = new Date('2026-10-02T12:00:05Z');

const user = (userId: string): IdentityChange => ({
  kind: 'user.upserted',
  profile: StaffProfile.of({ userId, firstName: userId, sourceUpdatedAt: before }),
});
const membership = (userId: string): IdentityChange => ({
  kind: 'membership.upserted',
  teamId: TeamId.of(TEAM),
  userId,
  providerRole: 'org:member',
  sourceUpdatedAt: before,
  profile: null,
});

describe('SyncStaffFromProvider', () => {
  const run = async (snapshot: IdentityChange[], stored: StoredStaffUser[]) => {
    const applied: string[] = [];
    const source: IdentitySource = {
      async *snapshot() {
        yield* snapshot;
      },
    };
    const apply = {
      execute: async (change: IdentityChange) => {
        if (change.kind === 'user.deleted') applied.push(`user.deleted:${change.userId}`);
        if (change.kind === 'membership.deleted') applied.push(`membership.deleted:${change.userId}`);
      },
    } as unknown as ApplyIdentityChange;
    const staff = { listActive: async () => stored } as unknown as StaffRepository;
    const clock: Clock = { now: () => startedAt };
    const result = await new SyncStaffFromProvider(source, apply, staff, clock).execute();
    return { result, applied };
  };

  it('removes users and memberships the provider no longer has', async () => {
    const { result, applied } = await run(
      [user('ana'), user('luis'), membership('ana')],
      [
        { userId: 'ana', sourceUpdatedAt: before, teams: [{ teamId: TEAM, sourceUpdatedAt: before }] },
        // Still in Clerk but removed from the IPS.
        { userId: 'luis', sourceUpdatedAt: before, teams: [{ teamId: TEAM, sourceUpdatedAt: before }] },
        // Deleted in Clerk.
        { userId: 'eva', sourceUpdatedAt: before, teams: [{ teamId: TEAM, sourceUpdatedAt: before }] },
      ],
    );
    expect(applied).toEqual(['membership.deleted:luis', 'user.deleted:eva']);
    expect(result).toMatchObject({ removedUsers: 1, removedMemberships: 1 });
  });

  it('keeps what a webhook added during the run, and removes nothing on an empty snapshot', async () => {
    const meanwhile = { userId: 'nuevo', sourceUpdatedAt: after, teams: [{ teamId: TEAM, sourceUpdatedAt: after }] };
    expect((await run([user('ana')], [meanwhile])).applied).toEqual([]);
    expect((await run([], [{ ...meanwhile, sourceUpdatedAt: before }])).applied).toEqual([]);
  });
});
