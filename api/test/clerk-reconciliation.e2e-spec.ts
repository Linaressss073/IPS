import { ORGANIZATIONS_COLLECTION } from '../src/contexts/organizations/infrastructure/persistence/mongo-organization.repository.js';
import { STAFF_COLLECTION } from '../src/contexts/staff/infrastructure/persistence/staff.document.js';
import { StaffProfile } from '../src/contexts/staff/domain/entities/staff-profile.vo.js';
import { TeamId } from '../src/shared/domain/index.js';
import { ClerkReconciler } from '../src/integrations/clerk/clerk-reconciler.js';
import { createTestApp, TEAM_A, TEAM_B } from './support/test-app.js';

describe('Clerk reconciliation (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  const past = new Date('2026-01-01T00:00:00Z');

  const user = (userId: string, firstName: string) => ({
    kind: 'user.upserted' as const,
    profile: StaffProfile.of({ userId, firstName, lastName: 'Gómez', email: `${userId}@clinica.co`, sourceUpdatedAt: past }),
  });
  const membership = (teamId: string, userId: string) => ({
    kind: 'membership.upserted' as const,
    teamId: TeamId.of(teamId),
    userId,
    providerRole: 'org:member',
    sourceUpdatedAt: past,
    profile: null,
  });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.wipe(STAFF_COLLECTION, ORGANIZATIONS_COLLECTION);
    t.organizationProvider.reset();
    for (const org of t.organizationProvider.organizations.values()) org.updatedAt = past;
  });

  afterAll(async () => {
    await t?.app.close();
  });

  it('applies what was deleted in Clerk while its webhooks were missed', async () => {
    const reconciler = t.app.get(ClerkReconciler);
    t.identitySource.changes = [
      user('alice', 'Alicia'),
      user('carol', 'Carolina'),
      user('bob', 'Roberto'),
      membership(TEAM_A, 'alice'),
      membership(TEAM_A, 'carol'),
      membership(TEAM_B, 'bob'),
    ];
    await reconciler.run();
    expect((await t.api('alice').get(`/teams/${TEAM_A}/staff`).expect(200)).body).toHaveLength(2);

    // In Clerk: carol is deleted and IPS Beta (with bob's membership) too.
    t.identitySource.changes = [user('alice', 'Alicia'), user('bob', 'Roberto'), membership(TEAM_A, 'alice')];
    t.organizationProvider.organizations.delete(TEAM_B);
    await reconciler.run();

    expect((await t.api('alice').get(`/teams/${TEAM_A}/staff`).expect(200)).body.map((m: { userId: string }) => m.userId))
      .toEqual(['alice']);
    expect(await t.mongo.collection(STAFF_COLLECTION).findOne({ _id: 'carol' as never })).toMatchObject({
      deleted: true,
      displayName: null,
      teams: [],
    });
    expect(await t.mongo.collection(STAFF_COLLECTION).findOne({ _id: 'bob' as never })).toMatchObject({
      deleted: false,
      teams: [],
    });
    expect(await t.mongo.collection(ORGANIZATIONS_COLLECTION).findOne({ _id: TEAM_B as never })).toMatchObject({
      status: 'deleted',
    });
    expect(await t.mongo.collection(ORGANIZATIONS_COLLECTION).findOne({ _id: TEAM_A as never })).toMatchObject({
      status: 'active',
    });
  });
});
