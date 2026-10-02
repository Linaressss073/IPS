import { createClerkClient } from '@clerk/backend';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../../config/env.js';
import { CLOCK, Clock } from '../../../../shared/application/index.js';
import type { Db } from 'mongodb';
import { MONGO_DB } from '../../../../shared/infrastructure/persistence/mongo.js';
import { systemClock } from '../../../../shared/infrastructure/providers/system-clock.js';
import { ApplyOrganizationChange } from '../../application/commands/apply-organization-change.command.js';
import { DeleteOrganization } from '../../application/commands/delete-organization.command.js';
import { SyncOrganizationsFromProvider } from '../../application/commands/sync-organizations-from-provider.command.js';
import { UpdateOrganization } from '../../application/commands/update-organization.command.js';
import {
  ORGANIZATION_PROVIDER,
  ORGANIZATION_REPOSITORY,
} from '../../application/constants/injection-tokens.js';
import type { OrganizationProvider } from '../../application/ports/organization-provider.port.js';
import type { OrganizationRepository } from '../../application/ports/organization.repository.port.js';
import { GetOrganization } from '../../application/queries/get-organization.query.js';
import { OrganizationFinder } from '../../application/services/organization-finder.service.js';
import { MongoOrganizationRepository } from '../persistence/mongo-organization.repository.js';
import { ClerkOrganizationProvider } from './clerk/clerk-organization-provider.js';

/** The only place where the organizations classes are wired to the framework. */
export const organizationsProviders: Provider[] = [
  { provide: CLOCK, useValue: systemClock },
  {
    provide: ORGANIZATION_REPOSITORY,
    inject: [MONGO_DB],
    useFactory: (db: Db): OrganizationRepository => new MongoOrganizationRepository(db),
  },
  {
    provide: ORGANIZATION_PROVIDER,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) =>
      new ClerkOrganizationProvider(
        createClerkClient({ secretKey: config.get('CLERK_SECRET_KEY') }),
      ),
  },
  {
    provide: OrganizationFinder,
    inject: [ORGANIZATION_REPOSITORY, ORGANIZATION_PROVIDER, CLOCK],
    useFactory: (
      repo: OrganizationRepository,
      provider: OrganizationProvider,
      clock: Clock,
    ) => new OrganizationFinder(repo, provider, clock),
  },
  {
    provide: GetOrganization,
    inject: [OrganizationFinder],
    useFactory: (finder: OrganizationFinder) => new GetOrganization(finder),
  },
  {
    provide: UpdateOrganization,
    inject: [ORGANIZATION_REPOSITORY, OrganizationFinder, ORGANIZATION_PROVIDER, CLOCK],
    useFactory: (
      repo: OrganizationRepository,
      finder: OrganizationFinder,
      provider: OrganizationProvider,
      clock: Clock,
    ) => new UpdateOrganization(repo, finder, provider, clock),
  },
  {
    provide: DeleteOrganization,
    inject: [ORGANIZATION_REPOSITORY, OrganizationFinder, ORGANIZATION_PROVIDER, CLOCK],
    useFactory: (
      repo: OrganizationRepository,
      finder: OrganizationFinder,
      provider: OrganizationProvider,
      clock: Clock,
    ) => new DeleteOrganization(repo, finder, provider, clock),
  },
  {
    provide: ApplyOrganizationChange,
    inject: [ORGANIZATION_REPOSITORY, CLOCK],
    useFactory: (repo: OrganizationRepository, clock: Clock) =>
      new ApplyOrganizationChange(repo, clock),
  },
  {
    provide: SyncOrganizationsFromProvider,
    inject: [ORGANIZATION_PROVIDER, ApplyOrganizationChange],
    useFactory: (provider: OrganizationProvider, apply: ApplyOrganizationChange) =>
      new SyncOrganizationsFromProvider(provider, apply),
  },
];
