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
  AddAddendum,
  SignConsultation,
  StartConsultation,
  UpdateConsultation,
} from '../../application/commands/consultation.commands.js';
import {
  CONSULTATION_APPOINTMENTS,
  CONSULTATION_NAMES,
  CONSULTATION_READ_MODEL,
  CONSULTATION_REPOSITORY,
  CONSULTATION_TEAM_MEMBERS,
} from '../../application/constants/consultation.tokens.js';
import type {
  ConsultationAppointments,
  ConsultationNames,
  ConsultationReadModel,
  ConsultationRepository,
} from '../../application/ports/consultation.ports.js';
import { ConsultationQueries } from '../../application/queries/consultation.queries.js';
import {
  MongoConsultationReadModel,
  MongoConsultationRepository,
} from '../persistence/mongo-consultation.js';

type ChangeCommand = new (
  consultations: ConsultationRepository,
  queries: ConsultationQueries,
  actors: ActorResolver,
  clock: Clock,
) => unknown;

const changeCommand = (Command: ChangeCommand): Provider => ({
  provide: Command,
  inject: [CONSULTATION_REPOSITORY, ConsultationQueries, ActorResolver, CLOCK],
  useFactory: (
    consultations: ConsultationRepository,
    queries: ConsultationQueries,
    actors: ActorResolver,
    clock: Clock,
  ) => new Command(consultations, queries, actors, clock),
});

/** The only place where the consultation classes are wired to the framework. */
export const consultationProviders: Provider[] = [
  { provide: CLOCK, useValue: systemClock },
  { provide: CONSULTATION_TEAM_MEMBERS, useExisting: TEAM_MEMBERSHIP_CHECKER },
  {
    provide: ActorResolver,
    inject: [CONSULTATION_TEAM_MEMBERS],
    useFactory: (members: TeamMembers) => new ActorResolver(members),
  },
  {
    provide: CONSULTATION_APPOINTMENTS,
    inject: [GetAppointment],
    useFactory: (getAppointment: GetAppointment): ConsultationAppointments => ({
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
    provide: CONSULTATION_NAMES,
    inject: [GetPatientSummaries, GetStaffNames],
    useFactory: (patients: GetPatientSummaries, staff: GetStaffNames): ConsultationNames => ({
      patients: (teamId, ids) => patients.execute(teamId, ids),
      staff: (ids) => staff.execute(ids),
    }),
  },
  {
    provide: CONSULTATION_REPOSITORY,
    inject: [MONGO_CLIENT, MONGO_DB],
    useFactory: (client: MongoClient, db: Db) => new MongoConsultationRepository(client, db),
  },
  {
    provide: CONSULTATION_READ_MODEL,
    inject: [MONGO_DB],
    useFactory: (db: Db) => new MongoConsultationReadModel(db),
  },
  {
    provide: ConsultationQueries,
    inject: [CONSULTATION_READ_MODEL, CONSULTATION_NAMES],
    useFactory: (readModel: ConsultationReadModel, names: ConsultationNames) =>
      new ConsultationQueries(readModel, names),
  },
  {
    provide: StartConsultation,
    inject: [CONSULTATION_REPOSITORY, CONSULTATION_APPOINTMENTS, ConsultationQueries, ActorResolver, CLOCK],
    useFactory: (
      consultations: ConsultationRepository,
      appointments: ConsultationAppointments,
      queries: ConsultationQueries,
      actors: ActorResolver,
      clock: Clock,
    ) => new StartConsultation(consultations, appointments, queries, actors, clock),
  },
  changeCommand(UpdateConsultation),
  changeCommand(SignConsultation),
  changeCommand(AddAddendum),
];
