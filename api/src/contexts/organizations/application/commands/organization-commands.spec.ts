import { Clock } from '../../../../shared/application/index.js';
import { InvalidValueError, TeamId } from '../../../../shared/domain/index.js';
import { OrganizationProfile } from '../../domain/entities/organization-profile.vo.js';
import { nitCheckDigit } from '../../domain/utils/nit-check-digit.js';
import { InMemoryOrganizationRepository } from '../../infrastructure/persistence/in-memory-organization.repository.fake.js';
import {
  OrganizationNotFoundError,
  OrganizationVersionConflictError,
} from '../errors/organization.errors.js';
import { OrganizationProvider } from '../ports/organization-provider.port.js';
import { GetOrganization } from '../queries/get-organization.query.js';
import { OrganizationFinder } from '../services/organization-finder.service.js';
import { ProviderOrganization } from '../types/organization.types.js';
import { ApplyOrganizationChange } from './apply-organization-change.command.js';
import { DeleteOrganization } from './delete-organization.command.js';
import { UpdateOrganization } from './update-organization.command.js';

const ipsId = TeamId.of('org_2xTeamA9fKq4LmN8pRsT1uVwY');
const clock: Clock = { now: () => new Date('2026-10-02T12:00:00Z') };

class FakeProvider implements OrganizationProvider {
  readonly organizations = new Map<string, ProviderOrganization>([
    [ipsId.value, { id: ipsId, name: 'IPS Alfa', updatedAt: new Date('2026-10-01T00:00:00Z') }],
  ]);
  readonly renamed: string[] = [];
  readonly deleted: string[] = [];

  async find(id: TeamId) {
    return this.organizations.get(id.value) ?? null;
  }
  async rename(_id: TeamId, name: string) {
    this.renamed.push(name);
  }
  async delete(id: TeamId) {
    this.deleted.push(id.value);
    this.organizations.delete(id.value);
  }
  async *list() {
    yield* this.organizations.values();
  }
}

describe('NIT check digit (DIAN)', () => {
  it('computes the check digit and validates it in the profile', () => {
    expect(nitCheckDigit('890903938')).toBe(8);
    expect(nitCheckDigit('900123456')).toBe(8);
    expect(OrganizationProfile.of({ nit: '890.903.938-8' }).value.nit).toBe('890903938-8');
    expect(() => OrganizationProfile.of({ nit: '890903938-1' })).toThrow(
      'wrong check digit',
    );
    expect(() => OrganizationProfile.of({ nit: '890903938' })).toThrow(InvalidValueError);
    expect(() => OrganizationProfile.of({ habilitationCode: '123' })).toThrow(
      InvalidValueError,
    );
  });
});

describe('Organization commands', () => {
  let repo: InMemoryOrganizationRepository;
  let provider: FakeProvider;
  let finder: OrganizationFinder;
  let update: UpdateOrganization;

  beforeEach(() => {
    repo = new InMemoryOrganizationRepository();
    provider = new FakeProvider();
    finder = new OrganizationFinder(repo, provider, clock);
    update = new UpdateOrganization(repo, finder, provider, clock);
  });

  it('imports the organization from the provider the first time it is read', async () => {
    const view = await new GetOrganization(finder).execute({ teamId: ipsId });
    expect(view).toMatchObject({ id: ipsId.value, name: 'IPS Alfa', version: 1, nit: null });
    expect(await repo.findById(ipsId)).not.toBeNull();
  });

  it('updates profile fields, keeps the others and clears with null', async () => {
    await update.execute({
      teamId: ipsId,
      expectedVersion: 1,
      profile: { nit: '900123456-8', city: 'Bogotá', phone: '601 555 1234' },
    });
    const view = await update.execute({
      teamId: ipsId,
      expectedVersion: 2,
      profile: { phone: null, habilitationCode: '110010000001' },
    });
    expect(view).toMatchObject({
      nit: '900123456-8',
      city: 'Bogotá',
      phone: null,
      habilitationCode: '110010000001',
      version: 3,
    });
    expect(provider.renamed).toEqual([]);
  });

  it('renames in the provider too, and rejects stale versions', async () => {
    await update.execute({ teamId: ipsId, expectedVersion: 1, name: ' IPS  Alfa Sur ', profile: {} });
    expect(provider.renamed).toEqual(['IPS Alfa Sur']);
    await expect(
      update.execute({ teamId: ipsId, expectedVersion: 1, profile: { city: 'Cali' } }),
    ).rejects.toThrow(OrganizationVersionConflictError);
  });

  it('deletes access in the provider and keeps a tombstone', async () => {
    await new DeleteOrganization(repo, finder, provider, clock).execute({
      teamId: ipsId,
      deletedBy: 'user_admin',
    });
    expect(provider.deleted).toEqual([ipsId.value]);
    const stored = await repo.findById(ipsId);
    expect(stored).toMatchObject({ isDeleted: true, deletedBy: 'user_admin' });
    await expect(new GetOrganization(finder).execute({ teamId: ipsId })).rejects.toThrow(
      OrganizationNotFoundError,
    );
  });

  it('follows provider changes, ignoring stale ones', async () => {
    const apply = new ApplyOrganizationChange(repo, clock);
    const change = (name: string, at: string) =>
      apply.execute({
        kind: 'organization.upserted',
        organization: { id: ipsId, name, updatedAt: new Date(at) },
      });

    await change('IPS Alfa', '2026-10-01T00:00:00Z');
    await change('IPS Alfa Norte', '2026-10-02T00:00:00Z');
    await change('Nombre viejo', '2026-09-01T00:00:00Z');
    expect((await repo.findById(ipsId))?.name.value).toBe('IPS Alfa Norte');

    await apply.execute({ kind: 'organization.deleted', id: ipsId });
    expect((await repo.findById(ipsId))?.isDeleted).toBe(true);
  });
});
