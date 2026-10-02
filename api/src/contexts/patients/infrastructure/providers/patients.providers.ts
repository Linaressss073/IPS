import { Provider } from '@nestjs/common';
import { CLOCK, Clock } from '../../../../shared/application/index.js';
import type { Db, MongoClient } from 'mongodb';
import {
  MONGO_CLIENT,
  MONGO_DB,
} from '../../../../shared/infrastructure/persistence/mongo.js';
import { systemClock } from '../../../../shared/infrastructure/providers/system-clock.js';
import { TEAM_MEMBERSHIP_CHECKER } from '../../../identity-access/application/constants/injection-tokens.js';
import { RecordCompanion } from '../../application/commands/record-companion.command.js';
import { RegisterPatient } from '../../application/commands/register-patient.command.js';
import { UpdatePatient } from '../../application/commands/update-patient.command.js';
import {
  PATIENT_READ_MODEL,
  PATIENT_REPOSITORY,
  PATIENT_TIMELINE_READER,
  STAFF_NAMES,
  TEAM_MEMBERS,
} from '../../application/constants/injection-tokens.js';
import type { PatientReadModel } from '../../application/ports/patient-read-model.port.js';
import type { StaffNames } from '../../application/ports/staff-names.port.js';
import { GetStaffNames } from '../../../staff/application/queries/get-staff-names.query.js';
import type { PatientRepository } from '../../application/ports/patient.repository.port.js';
import type { TeamMembers } from '../../application/ports/team-members.port.js';
import { GetPatientCompanions } from '../../application/queries/get-patient-companions.query.js';
import { GetPatientTimeline } from '../../application/queries/get-patient-timeline.query.js';
import { GetPatient } from '../../application/queries/get-patient.query.js';
import { SearchPatients } from '../../application/queries/search-patients.query.js';
import { ActorResolver } from '../../application/services/actor-resolver.service.js';
import { PatientFinder } from '../../application/services/patient-finder.service.js';
import type { PatientTimelineReader } from '../../application/ports/patient-timeline.port.js';
import { MongoPatientReadModel } from '../persistence/mongo-patient.read-model.js';
import { MongoPatientRepository } from '../persistence/mongo-patient.repository.js';
import { MongoPatientTimelineReader } from '../read-models/mongo-patient-timeline.reader.js';

/**
 * Domain and application classes are plain TypeScript (no Nest decorators);
 * this is the only place where they are wired to the framework.
 */
export const patientsProviders: Provider[] = [
  { provide: CLOCK, useValue: systemClock },
  // Membership comes from Identity & Access; the port has the same shape.
  { provide: TEAM_MEMBERS, useExisting: TEAM_MEMBERSHIP_CHECKER },
  // Names come from the Staff context's public query.
  {
    provide: STAFF_NAMES,
    inject: [GetStaffNames],
    useFactory: (getStaffNames: GetStaffNames): StaffNames => ({
      namesFor: (userIds) => getStaffNames.execute(userIds),
    }),
  },

  // Write side
  {
    provide: PATIENT_REPOSITORY,
    inject: [MONGO_CLIENT, MONGO_DB],
    useFactory: (client: MongoClient, db: Db) => new MongoPatientRepository(client, db),
  },
  {
    provide: PatientFinder,
    inject: [PATIENT_REPOSITORY],
    useFactory: (repo: PatientRepository) => new PatientFinder(repo),
  },
  {
    provide: ActorResolver,
    inject: [TEAM_MEMBERS],
    useFactory: (members: TeamMembers) => new ActorResolver(members),
  },
  {
    provide: RegisterPatient,
    inject: [PATIENT_REPOSITORY, ActorResolver, CLOCK],
    useFactory: (repo: PatientRepository, actors: ActorResolver, clock: Clock) =>
      new RegisterPatient(repo, actors, clock),
  },
  {
    provide: UpdatePatient,
    inject: [PATIENT_REPOSITORY, PatientFinder, ActorResolver, CLOCK],
    useFactory: (
      repo: PatientRepository,
      finder: PatientFinder,
      actors: ActorResolver,
      clock: Clock,
    ) => new UpdatePatient(repo, finder, actors, clock),
  },

  {
    provide: RecordCompanion,
    inject: [PATIENT_REPOSITORY, ActorResolver, CLOCK],
    useFactory: (repo: PatientRepository, actors: ActorResolver, clock: Clock) =>
      new RecordCompanion(repo, actors, clock),
  },

  // Read side
  {
    provide: PATIENT_READ_MODEL,
    inject: [MONGO_DB],
    useFactory: (db: Db) => new MongoPatientReadModel(db),
  },
  {
    provide: PATIENT_TIMELINE_READER,
    inject: [MONGO_DB],
    useFactory: (db: Db): PatientTimelineReader => new MongoPatientTimelineReader(db),
  },
  {
    provide: SearchPatients,
    inject: [PATIENT_READ_MODEL],
    useFactory: (readModel: PatientReadModel) => new SearchPatients(readModel),
  },
  {
    provide: GetPatient,
    inject: [PATIENT_READ_MODEL],
    useFactory: (readModel: PatientReadModel) => new GetPatient(readModel),
  },
  {
    provide: GetPatientTimeline,
    inject: [GetPatient, PATIENT_TIMELINE_READER, STAFF_NAMES],
    useFactory: (
      getPatient: GetPatient,
      timeline: PatientTimelineReader,
      staffNames: StaffNames,
    ) => new GetPatientTimeline(getPatient, timeline, staffNames),
  },
  {
    provide: GetPatientCompanions,
    inject: [GetPatient, PATIENT_TIMELINE_READER, STAFF_NAMES],
    useFactory: (
      getPatient: GetPatient,
      timeline: PatientTimelineReader,
      staffNames: StaffNames,
    ) => new GetPatientCompanions(getPatient, timeline, staffNames),
  },
];
