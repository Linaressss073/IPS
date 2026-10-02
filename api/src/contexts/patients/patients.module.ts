import { Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Db } from 'mongodb';
import { MONGO_DB } from '../../shared/infrastructure/persistence/mongo.js';
import { MongoConnection } from '../../shared/infrastructure/persistence/mongo-connection.js';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { PatientCommandsController } from './entrypoints/http/controllers/patient-commands.controller.js';
import { PatientQueriesController } from './entrypoints/http/controllers/patient-queries.controller.js';
import { ensurePatientIndexes } from './infrastructure/persistence/patient.document.js';
import { patientsProviders } from './infrastructure/providers/patients.providers.js';

/**
 * Bounded context "Patients": a single record per patient and team (IPS),
 * so no area asks for the same data twice, plus the patient's timeline.
 * Commands go through the domain; queries read documents directly (CQRS).
 */
@Module({
  imports: [IdentityAccessModule, StaffModule],
  controllers: [PatientCommandsController, PatientQueriesController],
  providers: patientsProviders,
})
export class PatientsModule implements OnModuleInit {
  constructor(
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly connection: MongoConnection,
  ) {}

  onModuleInit(): void {
    this.connection.afterConnect('patients indexes', () => ensurePatientIndexes(this.db));
  }
}
