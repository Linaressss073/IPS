import { Provider } from '@nestjs/common';
import type { Db, MongoClient } from 'mongodb';
import {
  ActorResolver,
  CLOCK,
  Clock,
  type TeamMembers,
} from '../../../../shared/application/index.js';
import { MONGO_CLIENT, MONGO_DB } from '../../../../shared/infrastructure/persistence/mongo.js';
import { systemClock } from '../../../../shared/infrastructure/providers/system-clock.js';
import { TEAM_MEMBERSHIP_CHECKER } from '../../../identity-access/application/constants/injection-tokens.js';
import { GetPatientSummaries } from '../../../patients/application/queries/get-patient-summaries.query.js';
import { GetAppointment } from '../../../scheduling/application/queries/get-appointment.query.js';
import { GetStaffNames } from '../../../staff/application/queries/get-staff-names.query.js';
import {
  AdvanceAnnouncements,
  AttendTurn,
  CallTurn,
  CheckIn,
  IssuePharmacyTurn,
  MarkNoShow,
  UpdateCallSettings,
} from '../../application/commands/admission.commands.js';
import {
  ADMISSION_PATIENTS,
  ADMISSION_STAFF_NAMES,
  ADMISSION_TEAM_MEMBERS,
  APPOINTMENT_DIRECTORY,
  CALL_SETTINGS_REPOSITORY,
  TURN_READ_MODEL,
  TURN_REPOSITORY,
} from '../../application/constants/admission.tokens.js';
import type {
  AdmissionPatients,
  AdmissionStaffNames,
  AppointmentDirectory,
  CallSettingsRepository,
  TurnReadModel,
  TurnRepository,
} from '../../application/ports/admission.ports.js';
import {
  GetBoard,
  GetCallSettings,
  GetTurn,
  ListTurns,
  TurnNames,
} from '../../application/queries/admission.queries.js';
import {
  MongoCallSettingsRepository,
  MongoTurnReadModel,
  MongoTurnRepository,
} from '../persistence/mongo-admission.js';
import { TurnAnnouncer } from './turn-announcer.js';

type TurnChange = new (
  turns: TurnRepository,
  settings: CallSettingsRepository,
  getTurn: GetTurn,
  actors: ActorResolver,
  clock: Clock,
) => unknown;

const turnChange = (Command: TurnChange): Provider => ({
  provide: Command,
  inject: [TURN_REPOSITORY, CALL_SETTINGS_REPOSITORY, GetTurn, ActorResolver, CLOCK],
  useFactory: (
    turns: TurnRepository,
    settings: CallSettingsRepository,
    getTurn: GetTurn,
    actors: ActorResolver,
    clock: Clock,
  ) => new Command(turns, settings, getTurn, actors, clock),
});

/** The only place where the admission classes are wired to the framework. */
export const admissionProviders: Provider[] = [
  { provide: CLOCK, useValue: systemClock },
  { provide: ADMISSION_TEAM_MEMBERS, useExisting: TEAM_MEMBERSHIP_CHECKER },
  {
    provide: ActorResolver,
    inject: [ADMISSION_TEAM_MEMBERS],
    useFactory: (members: TeamMembers) => new ActorResolver(members),
  },

  // Other contexts, through their public queries.
  {
    provide: APPOINTMENT_DIRECTORY,
    inject: [GetAppointment],
    useFactory: (getAppointment: GetAppointment): AppointmentDirectory => ({
      // Scheduling answers 404 APPOINTMENT_NOT_FOUND itself.
      get: async (teamId, appointmentId) => {
        const view = await getAppointment.execute(teamId, appointmentId);
        return {
          id: view.id,
          status: view.status,
          patientId: view.patient.id,
          professionalId: view.professional.userId,
          service: view.service,
          location: view.location,
          date: view.date,
          time: view.time,
        };
      },
    }),
  },
  {
    provide: ADMISSION_PATIENTS,
    inject: [GetPatientSummaries],
    useFactory: (summaries: GetPatientSummaries): AdmissionPatients => ({
      summaries: (teamId, ids) => summaries.execute(teamId, ids),
    }),
  },
  {
    provide: ADMISSION_STAFF_NAMES,
    inject: [GetStaffNames],
    useFactory: (names: GetStaffNames): AdmissionStaffNames => ({
      namesFor: (ids) => names.execute(ids),
    }),
  },

  // Write side
  {
    provide: TURN_REPOSITORY,
    inject: [MONGO_CLIENT, MONGO_DB],
    useFactory: (client: MongoClient, db: Db) => new MongoTurnRepository(client, db),
  },
  {
    provide: CALL_SETTINGS_REPOSITORY,
    inject: [MONGO_CLIENT, MONGO_DB],
    useFactory: (client: MongoClient, db: Db) => new MongoCallSettingsRepository(client, db),
  },
  {
    provide: CheckIn,
    inject: [TURN_REPOSITORY, APPOINTMENT_DIRECTORY, GetTurn, ActorResolver, CLOCK],
    useFactory: (
      turns: TurnRepository,
      appointments: AppointmentDirectory,
      getTurn: GetTurn,
      actors: ActorResolver,
      clock: Clock,
    ) => new CheckIn(turns, appointments, getTurn, actors, clock),
  },
  {
    provide: IssuePharmacyTurn,
    inject: [TURN_REPOSITORY, GetTurn, ActorResolver, CLOCK],
    useFactory: (turns: TurnRepository, getTurn: GetTurn, actors: ActorResolver, clock: Clock) =>
      new IssuePharmacyTurn(turns, getTurn, actors, clock),
  },
  turnChange(CallTurn),
  turnChange(AttendTurn),
  turnChange(MarkNoShow),
  {
    provide: AdvanceAnnouncements,
    inject: [TURN_REPOSITORY, CALL_SETTINGS_REPOSITORY, CLOCK],
    useFactory: (turns: TurnRepository, settings: CallSettingsRepository, clock: Clock) =>
      new AdvanceAnnouncements(turns, settings, clock),
  },
  {
    provide: UpdateCallSettings,
    inject: [CALL_SETTINGS_REPOSITORY, ActorResolver, CLOCK],
    useFactory: (settings: CallSettingsRepository, actors: ActorResolver, clock: Clock) =>
      new UpdateCallSettings(settings, actors, clock),
  },
  TurnAnnouncer,

  // Read side
  {
    provide: TURN_READ_MODEL,
    inject: [MONGO_DB],
    useFactory: (db: Db) => new MongoTurnReadModel(db),
  },
  {
    provide: TurnNames,
    inject: [ADMISSION_PATIENTS, ADMISSION_STAFF_NAMES],
    useFactory: (patients: AdmissionPatients, staff: AdmissionStaffNames) => new TurnNames(patients, staff),
  },
  {
    provide: ListTurns,
    inject: [TURN_READ_MODEL, TurnNames, CLOCK],
    useFactory: (readModel: TurnReadModel, names: TurnNames, clock: Clock) =>
      new ListTurns(readModel, names, clock),
  },
  {
    provide: GetTurn,
    inject: [TURN_READ_MODEL, TurnNames],
    useFactory: (readModel: TurnReadModel, names: TurnNames) => new GetTurn(readModel, names),
  },
  {
    provide: GetBoard,
    inject: [TURN_READ_MODEL, TurnNames, CALL_SETTINGS_REPOSITORY, CLOCK],
    useFactory: (
      readModel: TurnReadModel,
      names: TurnNames,
      settings: CallSettingsRepository,
      clock: Clock,
    ) => new GetBoard(readModel, names, settings, clock),
  },
  {
    provide: GetCallSettings,
    inject: [CALL_SETTINGS_REPOSITORY],
    useFactory: (settings: CallSettingsRepository) => new GetCallSettings(settings),
  },
];
