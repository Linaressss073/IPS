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
import { GetStaffNames } from '../../../staff/application/queries/get-staff-names.query.js';
import { ListTeamStaff } from '../../../staff/application/queries/list-team-staff.query.js';
import { CancelAppointment } from '../../application/commands/cancel-appointment.command.js';
import { ConfirmAppointment } from '../../application/commands/confirm-appointment.command.js';
import { CreateLocation } from '../../application/commands/create-location.command.js';
import { CreateService } from '../../application/commands/create-service.command.js';
import { DeleteAgenda } from '../../application/commands/delete-agenda.command.js';
import { OpenAgenda } from '../../application/commands/open-agenda.command.js';
import { RescheduleAppointment } from '../../application/commands/reschedule-appointment.command.js';
import { ScheduleAppointment } from '../../application/commands/schedule-appointment.command.js';
import { UpdateLocation } from '../../application/commands/update-location.command.js';
import { UpdateService } from '../../application/commands/update-service.command.js';
import {
  AGENDA_REPOSITORY,
  APPOINTMENT_REPOSITORY,
  LOCATION_REPOSITORY,
  PATIENT_DIRECTORY,
  PROFESSIONALS,
  SCHEDULING_READ_MODEL,
  SCHEDULING_TEAM_MEMBERS,
  SERVICE_REPOSITORY,
} from '../../application/constants/injection-tokens.js';
import type { PatientDirectory, Professionals } from '../../application/ports/other-contexts.port.js';
import type { SchedulingReadModel } from '../../application/ports/scheduling-read-model.port.js';
import type {
  AgendaRepository,
  AppointmentRepository,
  LocationRepository,
  ServiceRepository,
} from '../../application/ports/scheduling.repositories.port.js';
import { GetAppointment } from '../../application/queries/get-appointment.query.js';
import {
  GetDayAgenda,
  ListLocations,
  ListProfessionals,
  ListServices,
} from '../../application/queries/scheduling.queries.js';
import { SearchAppointments } from '../../application/queries/search-appointments.query.js';
import { NameResolver } from '../../application/services/name-resolver.service.js';
import { SchedulingFinder } from '../../application/services/scheduling-finder.service.js';
import { MongoSchedulingReadModel } from '../persistence/mongo-scheduling.read-model.js';
import {
  MongoAgendaRepository,
  MongoAppointmentRepository,
  MongoLocationRepository,
  MongoServiceRepository,
} from '../persistence/mongo-scheduling.repositories.js';

/** The staff role that can have an agenda. */
const PROFESSIONAL_ROLE = 'medico';

const mongoRepository = <T>(token: symbol, Repository: new (client: MongoClient, db: Db) => T) => ({
  provide: token,
  inject: [MONGO_CLIENT, MONGO_DB],
  useFactory: (client: MongoClient, db: Db) => new Repository(client, db),
});

type ChangeCommand = new (
  appointments: AppointmentRepository,
  finder: SchedulingFinder,
  getAppointment: GetAppointment,
  actors: ActorResolver,
  clock: Clock,
) => unknown;

const changeCommand = (Command: ChangeCommand): Provider => ({
  provide: Command,
  inject: [APPOINTMENT_REPOSITORY, SchedulingFinder, GetAppointment, ActorResolver, CLOCK],
  useFactory: (
    appointments: AppointmentRepository,
    finder: SchedulingFinder,
    getAppointment: GetAppointment,
    actors: ActorResolver,
    clock: Clock,
  ) => new Command(appointments, finder, getAppointment, actors, clock),
});

/** The only place where the scheduling classes are wired to the framework. */
export const schedulingProviders: Provider[] = [
  { provide: CLOCK, useValue: systemClock },
  { provide: SCHEDULING_TEAM_MEMBERS, useExisting: TEAM_MEMBERSHIP_CHECKER },
  {
    provide: ActorResolver,
    inject: [SCHEDULING_TEAM_MEMBERS],
    useFactory: (members: TeamMembers) => new ActorResolver(members),
  },

  // Other contexts, through their public queries.
  {
    provide: PATIENT_DIRECTORY,
    inject: [GetPatientSummaries],
    useFactory: (summaries: GetPatientSummaries): PatientDirectory => ({
      summaries: (teamId, ids) => summaries.execute(teamId, ids),
    }),
  },
  {
    provide: PROFESSIONALS,
    inject: [ListTeamStaff, GetStaffNames],
    useFactory: (listStaff: ListTeamStaff, staffNames: GetStaffNames): Professionals => ({
      list: async (teamId) =>
        (await listStaff.execute({ teamId }))
          .filter((member) => member.roles.includes(PROFESSIONAL_ROLE))
          .map((member) => ({ userId: member.userId, displayName: member.displayName })),
      namesFor: (userIds) => staffNames.execute(userIds),
    }),
  },

  // Write side
  mongoRepository(SERVICE_REPOSITORY, MongoServiceRepository),
  mongoRepository(LOCATION_REPOSITORY, MongoLocationRepository),
  mongoRepository(AGENDA_REPOSITORY, MongoAgendaRepository),
  mongoRepository(APPOINTMENT_REPOSITORY, MongoAppointmentRepository),
  {
    provide: SchedulingFinder,
    inject: [SERVICE_REPOSITORY, LOCATION_REPOSITORY, AGENDA_REPOSITORY, APPOINTMENT_REPOSITORY],
    useFactory: (
      services: ServiceRepository,
      locations: LocationRepository,
      agendas: AgendaRepository,
      appointments: AppointmentRepository,
    ) => new SchedulingFinder(services, locations, agendas, appointments),
  },
  {
    provide: CreateService,
    inject: [SERVICE_REPOSITORY, ActorResolver, CLOCK],
    useFactory: (repo: ServiceRepository, actors: ActorResolver, clock: Clock) =>
      new CreateService(repo, actors, clock),
  },
  {
    provide: UpdateService,
    inject: [SERVICE_REPOSITORY, SchedulingFinder, ActorResolver, CLOCK],
    useFactory: (repo: ServiceRepository, finder: SchedulingFinder, actors: ActorResolver, clock: Clock) =>
      new UpdateService(repo, finder, actors, clock),
  },
  {
    provide: CreateLocation,
    inject: [LOCATION_REPOSITORY, ActorResolver, CLOCK],
    useFactory: (repo: LocationRepository, actors: ActorResolver, clock: Clock) =>
      new CreateLocation(repo, actors, clock),
  },
  {
    provide: UpdateLocation,
    inject: [LOCATION_REPOSITORY, SchedulingFinder, ActorResolver, CLOCK],
    useFactory: (repo: LocationRepository, finder: SchedulingFinder, actors: ActorResolver, clock: Clock) =>
      new UpdateLocation(repo, finder, actors, clock),
  },
  {
    provide: OpenAgenda,
    inject: [AGENDA_REPOSITORY, SchedulingFinder, PROFESSIONALS, ActorResolver, CLOCK],
    useFactory: (
      repo: AgendaRepository,
      finder: SchedulingFinder,
      professionals: Professionals,
      actors: ActorResolver,
      clock: Clock,
    ) => new OpenAgenda(repo, finder, professionals, actors, clock),
  },
  {
    provide: DeleteAgenda,
    inject: [AGENDA_REPOSITORY, APPOINTMENT_REPOSITORY, SchedulingFinder, ActorResolver, CLOCK],
    useFactory: (
      agendas: AgendaRepository,
      appointments: AppointmentRepository,
      finder: SchedulingFinder,
      actors: ActorResolver,
      clock: Clock,
    ) => new DeleteAgenda(agendas, appointments, finder, actors, clock),
  },
  {
    provide: ScheduleAppointment,
    inject: [APPOINTMENT_REPOSITORY, SchedulingFinder, PATIENT_DIRECTORY, GetAppointment, ActorResolver, CLOCK],
    useFactory: (
      appointments: AppointmentRepository,
      finder: SchedulingFinder,
      patients: PatientDirectory,
      getAppointment: GetAppointment,
      actors: ActorResolver,
      clock: Clock,
    ) => new ScheduleAppointment(appointments, finder, patients, getAppointment, actors, clock),
  },
  changeCommand(ConfirmAppointment),
  changeCommand(CancelAppointment),
  changeCommand(RescheduleAppointment),

  // Read side
  {
    provide: SCHEDULING_READ_MODEL,
    inject: [MONGO_DB],
    useFactory: (db: Db) => new MongoSchedulingReadModel(db),
  },
  {
    provide: NameResolver,
    inject: [PATIENT_DIRECTORY, PROFESSIONALS],
    useFactory: (patients: PatientDirectory, professionals: Professionals) =>
      new NameResolver(patients, professionals),
  },
  {
    provide: ListServices,
    inject: [SCHEDULING_READ_MODEL],
    useFactory: (readModel: SchedulingReadModel) => new ListServices(readModel),
  },
  {
    provide: ListLocations,
    inject: [SCHEDULING_READ_MODEL],
    useFactory: (readModel: SchedulingReadModel) => new ListLocations(readModel),
  },
  {
    provide: ListProfessionals,
    inject: [PROFESSIONALS],
    useFactory: (professionals: Professionals) => new ListProfessionals(professionals),
  },
  {
    provide: GetDayAgenda,
    inject: [SCHEDULING_READ_MODEL, NameResolver],
    useFactory: (readModel: SchedulingReadModel, names: NameResolver) => new GetDayAgenda(readModel, names),
  },
  {
    provide: SearchAppointments,
    inject: [SCHEDULING_READ_MODEL, NameResolver],
    useFactory: (readModel: SchedulingReadModel, names: NameResolver) =>
      new SearchAppointments(readModel, names),
  },
  {
    provide: GetAppointment,
    inject: [SCHEDULING_READ_MODEL, NameResolver],
    useFactory: (readModel: SchedulingReadModel, names: NameResolver) => new GetAppointment(readModel, names),
  },
];
