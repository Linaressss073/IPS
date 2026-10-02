import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { API_PREFIX } from '../../src/config/http.js';
import {
  ACCESS_TOKEN_VERIFIER,
  TEAM_MEMBERSHIP_CHECKER,
} from '../../src/contexts/identity-access/application/constants/injection-tokens.js';
import { AuthenticatedUser } from '../../src/contexts/identity-access/domain/entities/authenticated-user.entity.js';
import { ORGANIZATION_PROVIDER } from '../../src/contexts/organizations/application/constants/injection-tokens.js';
import { TeamId, UserId } from '../../src/shared/domain/index.js';
import { MONGO_DB } from '../../src/shared/infrastructure/persistence/mongo.js';
import type { Db } from 'mongodb';

export const TEAM_A = 'org_2xTeamA9fKq4LmN8pRsT1uVwY';
export const TEAM_B = 'org_2xTeamB3gHj7KlP0qWeR5tYuI';

// Clerk is replaced by fakes: "alice" is admin of team A and "carol" a member
// of it; "bob" is admin of team B.
const membership: Record<string, { team: string; role: string }> = {
  alice: { team: TEAM_A, role: 'admin' },
  carol: { team: TEAM_A, role: 'member' },
  bob: { team: TEAM_B, role: 'admin' },
};

const roleIn = async (userId: UserId, teamId: { value: string }) =>
  membership[userId.value]?.team === teamId.value
    ? membership[userId.value].role
    : null;

/** Fake Clerk organizations; tests can inspect what was renamed or deleted. */
export class FakeOrganizationProvider {
  readonly organizations = new Map<
    string,
    { id: TeamId; name: string; updatedAt: Date }
  >();
  readonly renamed: string[] = [];
  readonly deleted: string[] = [];

  reset() {
    this.organizations.clear();
    this.renamed.length = 0;
    this.deleted.length = 0;
    for (const [id, name] of [
      [TEAM_A, 'IPS Alfa'],
      [TEAM_B, 'IPS Beta'],
    ]) {
      this.organizations.set(id, {
        id: TeamId.of(id),
        name,
        updatedAt: new Date('2026-10-01T00:00:00Z'),
      });
    }
  }

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

/** Boots the real AppModule against the docker-compose MongoDB, with Clerk faked. */
export async function createTestApp() {
  const organizationProvider = new FakeOrganizationProvider();
  organizationProvider.reset();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ACCESS_TOKEN_VERIFIER)
    .useValue({
      // "dana" is not a member per the checker, but her token selects team A
      // (as a member).
      verify: async (token: string) =>
        token === 'dana'
          ? new AuthenticatedUser(UserId.of(token), TeamId.of(TEAM_A), 'member')
          : membership[token]
            ? new AuthenticatedUser(UserId.of(token), null)
            : null,
    })
    .overrideProvider(TEAM_MEMBERSHIP_CHECKER)
    .useValue({
      roleIn,
      isMember: async (userId: UserId, teamId: { value: string }) =>
        (await roleIn(userId, teamId)) !== null,
    })
    .overrideProvider(ORGANIZATION_PROVIDER)
    .useValue(organizationProvider)
    .compile();

  const app: INestApplication<App> = moduleRef.createNestApplication({
    rawBody: true,
  });
  app.setGlobalPrefix(API_PREFIX);
  await app.init();
  const mongo = moduleRef.get<Db>(MONGO_DB);

  /** Empties the given collections (indexes are kept). */
  const wipe = (...collections: string[]) =>
    Promise.all(collections.map((name) => mongo.collection(name).deleteMany({})));

  /**
   * supertest client authenticated as the given fake user (or anonymous).
   * URLs are relative to the API prefix: `/health` hits `/api/v1/health`.
   */
  const api = (token?: string) => {
    const agent = request(app.getHttpServer());
    const at = (url: string) => `/${API_PREFIX}${url}`;
    const auth = (req: request.Test) =>
      token ? req.set('Authorization', `Bearer ${token}`) : req;
    return {
      get: (url: string) => auth(agent.get(at(url))),
      post: (url: string, body?: object) =>
        auth(agent.post(at(url)).send(body)),
      patch: (url: string, body: object) =>
        auth(agent.patch(at(url)).send(body)),
      put: (url: string, body: object) => auth(agent.put(at(url)).send(body)),
      delete: (url: string) => auth(agent.delete(at(url))),
    };
  };

  return { app, mongo, wipe, api, organizationProvider };
}
