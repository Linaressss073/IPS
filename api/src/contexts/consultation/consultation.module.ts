import { Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Db } from 'mongodb';
import { MONGO_DB } from '../../shared/infrastructure/persistence/mongo.js';
import { MongoConnection } from '../../shared/infrastructure/persistence/mongo-connection.js';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { PatientsModule } from '../patients/patients.module.js';
import { SchedulingModule } from '../scheduling/scheduling.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { ConsultationsController } from './entrypoints/http/controllers/consultations.controller.js';
import { ensureConsultationIndexes } from './infrastructure/persistence/mongo-consultation.js';
import { consultationProviders } from './infrastructure/providers/consultation.providers.js';

/**
 * Bounded context "Consultation" (consulta médica): the clinical record of
 * each appointment, written and signed by its physician — reason, current
 * illness, vital signs, physical exam, CIE-10 diagnoses, plan and the
 * prescription pharmacy will dispense. Signed records only take addenda.
 */
@Module({
  imports: [IdentityAccessModule, PatientsModule, SchedulingModule, StaffModule],
  controllers: [ConsultationsController],
  providers: consultationProviders,
})
export class ConsultationModule implements OnModuleInit {
  constructor(
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly connection: MongoConnection,
  ) {}

  onModuleInit(): void {
    this.connection.afterConnect('consultation indexes', () => ensureConsultationIndexes(this.db));
  }
}
