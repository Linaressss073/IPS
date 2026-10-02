import { createClerkClient } from '@clerk/backend';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../../config/env.js';
import { CLOCK, Clock } from '../../../../shared/application/index.js';
import type { Db, MongoClient } from 'mongodb';
import {
  MONGO_CLIENT,
  MONGO_DB,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { systemClock } from '../../../../shared/infrastructure/providers/system-clock.js';
import { TEAM_MEMBERSHIP_CHECKER } from '../../../identity-access/application/constants/injection-tokens.js';
import { ApplyIdentityChange } from '../../application/commands/apply-identity-change.command.js';
import { AssignStaffRoles } from '../../application/commands/assign-staff-roles.command.js';
import { SyncStaffFromProvider } from '../../application/commands/sync-staff-from-provider.command.js';
import {
  IDENTITY_SOURCE,
  STAFF_READ_MODEL,
  STAFF_REPOSITORY,
  TEAM_MEMBERS,
} from '../../application/constants/injection-tokens.js';
import type { IdentitySource } from '../../application/ports/identity-source.port.js';
import type { StaffReadModel } from '../../application/ports/staff-read-model.port.js';
import type { StaffRepository } from '../../application/ports/staff.repository.port.js';
import type { TeamMembers } from '../../application/ports/team-members.port.js';
import { GetStaffNames } from '../../application/queries/get-staff-names.query.js';
import { ListTeamStaff } from '../../application/queries/list-team-staff.query.js';
import { AccessService } from '../../application/services/access.service.js';
import { PermissionGuard } from '../../entrypoints/http/guards/permission.guard.js';
import { MongoStaffReadModel } from '../persistence/mongo-staff.read-model.js';
import { MongoStaffRepository } from '../persistence/mongo-staff.repository.js';
import { ClerkIdentitySource } from './clerk/clerk-identity-source.js';

/** The only place where the staff classes are wired to the framework. */
export const staffProviders: Provider[] = [
  { provide: CLOCK, useValue: systemClock },
  // Membership and provider role come from Identity & Access; same shape.
  { provide: TEAM_MEMBERS, useExisting: TEAM_MEMBERSHIP_CHECKER },
  {
    provide: STAFF_REPOSITORY,
    inject: [MONGO_CLIENT, MONGO_DB],
    useFactory: (client: MongoClient, db: Db) => new MongoStaffRepository(client, db),
  },
  {
    provide: STAFF_READ_MODEL,
    inject: [MONGO_DB],
    useFactory: (db: Db) => new MongoStaffReadModel(db),
  },
  {
    provide: IDENTITY_SOURCE,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) =>
      new ClerkIdentitySource(
        createClerkClient({ secretKey: config.get('CLERK_SECRET_KEY') }),
      ),
  },
  {
    provide: ApplyIdentityChange,
    inject: [STAFF_REPOSITORY, CLOCK],
    useFactory: (repo: StaffRepository, clock: Clock) => new ApplyIdentityChange(repo, clock),
  },
  {
    provide: SyncStaffFromProvider,
    inject: [IDENTITY_SOURCE, ApplyIdentityChange],
    useFactory: (source: IdentitySource, apply: ApplyIdentityChange) =>
      new SyncStaffFromProvider(source, apply),
  },
  {
    provide: AccessService,
    inject: [STAFF_READ_MODEL],
    useFactory: (readModel: StaffReadModel) => new AccessService(readModel),
  },
  PermissionGuard,
  {
    provide: AssignStaffRoles,
    inject: [STAFF_REPOSITORY, STAFF_READ_MODEL, TEAM_MEMBERS, CLOCK],
    useFactory: (
      repo: StaffRepository,
      readModel: StaffReadModel,
      members: TeamMembers,
      clock: Clock,
    ) => new AssignStaffRoles(repo, readModel, members, clock),
  },
  {
    provide: ListTeamStaff,
    inject: [STAFF_READ_MODEL],
    useFactory: (readModel: StaffReadModel) => new ListTeamStaff(readModel),
  },
  {
    provide: GetStaffNames,
    inject: [STAFF_READ_MODEL],
    useFactory: (readModel: StaffReadModel) => new GetStaffNames(readModel),
  },
];
