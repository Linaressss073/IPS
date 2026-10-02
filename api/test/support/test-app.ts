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
import { UserId } from '../../src/shared/domain/index.js';
import {
  DRIZZLE,
  Database,
} from '../../src/shared/infrastructure/persistence/database.module.js';
import { MONGO_DB } from '../../src/shared/infrastructure/persistence/mongo.js';
import { TraceEventRelay } from '../../src/shared/infrastructure/providers/trace-event-relay.js';
import type { Db } from 'mongodb';

export const TEAM_A = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
export const TEAM_B = '16fd2706-8baf-433b-82eb-8c7fada847da';

// Hexclave is replaced by fakes: tokens "alice" and "carol" belong to team A,
// "bob" to team B.
const membership: Record<string, string> = {
  alice: TEAM_A,
  carol: TEAM_A,
  bob: TEAM_B,
};

/** Boots the real AppModule against the docker-compose Postgres, with Hexclave faked. */
export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ACCESS_TOKEN_VERIFIER)
    .useValue({
      verify: async (token: string) =>
        membership[token]
          ? new AuthenticatedUser(UserId.of(token), null)
          : null,
    })
    .overrideProvider(TEAM_MEMBERSHIP_CHECKER)
    .useValue({
      isMember: async (userId: UserId, teamId: { value: string }) =>
        membership[userId.value] === teamId.value,
    })
    .compile();

  const app: INestApplication<App> = moduleRef.createNestApplication();
  app.setGlobalPrefix(API_PREFIX);
  await app.init();
  const db = moduleRef.get<Database>(DRIZZLE);
  const mongo = moduleRef.get<Db>(MONGO_DB);
  const relay = moduleRef.get(TraceEventRelay);

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
      delete: (url: string) => auth(agent.delete(at(url))),
    };
  };

  return { app, db, mongo, relay, api };
}
