import type { WebhookEvent } from '@clerk/backend/webhooks';
import { toIdentityChange } from './clerk-identity-change.mapper.js';

const asEvent = (event: unknown) => event as WebhookEvent;

const user = {
  id: 'user_2abc',
  first_name: 'Ana',
  last_name: 'Gómez',
  username: null,
  primary_email_address_id: 'idn_1',
  email_addresses: [
    { id: 'idn_0', email_address: 'old@personal.com' },
    { id: 'idn_1', email_address: 'ana.gomez@clinica.com.co' },
  ],
  phone_numbers: [{ phone_number: '+573001234567' }],
  image_url: 'https://img.clerk.com/ana.png',
  updated_at: 1790924973656,
};

describe('toIdentityChange (Clerk webhooks)', () => {
  it('keeps only the name and the masked primary e-mail of a user', () => {
    const change = toIdentityChange(asEvent({ type: 'user.updated', data: user }));
    expect(change).toMatchObject({ kind: 'user.upserted' });
    expect(change?.kind === 'user.upserted' && change.profile.value).toEqual({
      userId: 'user_2abc',
      displayName: 'Ana Gómez',
      emailMasked: 'ana****@cli***.c**',
      sourceUpdatedAt: new Date(1790924973656),
    });
    // Phone, photo and the other e-mails never leave the mapper.
    expect(JSON.stringify(change)).not.toMatch(/573001234567|img\.clerk|personal\.com/);
  });

  it('translates deletions and memberships', () => {
    expect(
      toIdentityChange(asEvent({ type: 'user.deleted', data: { id: 'user_2abc', deleted: true } })),
    ).toEqual({ kind: 'user.deleted', userId: 'user_2abc' });

    const membership = {
      role: 'org:admin',
      updated_at: 1790924973700,
      organization: { id: 'org_2IPS' },
      public_user_data: {
        user_id: 'user_2abc',
        first_name: 'Ana',
        last_name: 'Gómez',
        identifier: 'ana.gomez@clinica.com.co',
      },
    };
    const created = toIdentityChange(
      asEvent({ type: 'organizationMembership.created', data: membership }),
    );
    expect(created).toMatchObject({
      kind: 'membership.upserted',
      userId: 'user_2abc',
      providerRole: 'org:admin',
    });
    expect(created?.kind === 'membership.upserted' && created.teamId.value).toBe('org_2IPS');
    expect(
      created?.kind === 'membership.upserted' && created.profile?.emailMasked,
    ).toBe('ana****@cli***.c**');

    expect(
      toIdentityChange(asEvent({ type: 'organizationMembership.deleted', data: membership })),
    ).toMatchObject({ kind: 'membership.deleted', userId: 'user_2abc' });
    expect(
      toIdentityChange(asEvent({ type: 'organization.deleted', data: { id: 'org_2IPS', deleted: true } })),
    ).toMatchObject({ kind: 'team.deleted' });
  });

  it('ignores events the staff directory does not use', () => {
    expect(toIdentityChange(asEvent({ type: 'session.created', data: {} }))).toBeNull();
  });
});
