import { Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Db } from 'mongodb';
import { MONGO_DB } from '../../shared/infrastructure/persistence/mongo.js';
import { MongoConnection } from '../../shared/infrastructure/persistence/mongo-connection.js';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { PatientsModule } from '../patients/patients.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { AgendasController } from './entrypoints/http/controllers/agendas.controller.js';
import { AppointmentsController } from './entrypoints/http/controllers/appointments.controller.js';
import { SchedulingSettingsController } from './entrypoints/http/controllers/scheduling-settings.controller.js';
import { ensureSchedulingIndexes } from './infrastructure/persistence/scheduling.documents.js';
import { schedulingProviders } from './infrastructure/providers/scheduling.providers.js';
import { GetAppointment } from './application/queries/get-appointment.query.js';
import { ListLocations } from './application/queries/scheduling.queries.js';

/**
 * Bounded context "Scheduling" (agendamiento): services and locations of
 * the IPS, professionals' agendas split into slots, and appointments of
 * registered patients. Each step of an appointment goes to the patient's
 * timeline. Admission picks the appointments up from here.
 */
@Module({
  imports: [IdentityAccessModule, PatientsModule, StaffModule],
  controllers: [SchedulingSettingsController, AgendasController, AppointmentsController],
  providers: schedulingProviders,
  // Public queries: admission reads the appointment; pharmacy, its windows (locations).
  exports: [GetAppointment, ListLocations],
})
export class SchedulingModule implements OnModuleInit {
  constructor(
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly connection: MongoConnection,
  ) {}

  onModuleInit(): void {
    this.connection.afterConnect('scheduling indexes', () => ensureSchedulingIndexes(this.db));
  }
}
