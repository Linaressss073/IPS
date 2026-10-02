import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { PatientCommandsController } from './entrypoints/http/controllers/patient-commands.controller.js';
import { PatientQueriesController } from './entrypoints/http/controllers/patient-queries.controller.js';
import { patientsProviders } from './infrastructure/providers/patients.providers.js';

/**
 * Bounded context "Patients": a single record per patient and team (IPS),
 * so no area asks for the same data twice, plus the patient's timeline.
 * Commands write to Postgres; queries read from read models (CQRS).
 */
@Module({
  imports: [IdentityAccessModule, StaffModule],
  controllers: [PatientCommandsController, PatientQueriesController],
  providers: patientsProviders,
})
export class PatientsModule {}
