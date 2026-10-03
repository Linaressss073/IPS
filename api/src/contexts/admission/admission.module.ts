import { Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Db } from 'mongodb';
import { MONGO_DB } from '../../shared/infrastructure/persistence/mongo.js';
import { MongoConnection } from '../../shared/infrastructure/persistence/mongo-connection.js';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { PatientsModule } from '../patients/patients.module.js';
import { SchedulingModule } from '../scheduling/scheduling.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { AdmissionController } from './entrypoints/http/controllers/admission.controller.js';
import { ensureAdmissionIndexes } from './infrastructure/persistence/mongo-admission.js';
import { admissionProviders } from './infrastructure/providers/admission.providers.js';

/**
 * Bounded context "Admission": the patient arrives for today's appointment,
 * gets a turn per service and day (RTH 4), and is called on the
 * waiting-room screen — re-announced automatically, and closed as
 * "no se presentó" after the IPS's last call. Every step goes to the
 * patient's timeline.
 */
@Module({
  imports: [IdentityAccessModule, PatientsModule, SchedulingModule, StaffModule],
  controllers: [AdmissionController],
  providers: admissionProviders,
})
export class AdmissionModule implements OnModuleInit {
  constructor(
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly connection: MongoConnection,
  ) {}

  onModuleInit(): void {
    this.connection.afterConnect('admission indexes', () => ensureAdmissionIndexes(this.db));
  }
}
