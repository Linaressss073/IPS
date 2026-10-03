import { Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Db } from 'mongodb';
import { MONGO_DB } from '../../shared/infrastructure/persistence/mongo.js';
import { MongoConnection } from '../../shared/infrastructure/persistence/mongo-connection.js';
import { AdmissionModule } from '../admission/admission.module.js';
import { ConsultationModule } from '../consultation/consultation.module.js';
import { IdentityAccessModule } from '../identity-access/identity-access.module.js';
import { PatientsModule } from '../patients/patients.module.js';
import { SchedulingModule } from '../scheduling/scheduling.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { InventoryController } from './entrypoints/http/controllers/inventory.controller.js';
import { PharmacyController } from './entrypoints/http/controllers/pharmacy.controller.js';
import { ensureDispensationIndexes } from './infrastructure/persistence/mongo-dispensation.js';
import { ensureProductIndexes } from './infrastructure/persistence/mongo-product.js';
import { pharmacyProviders } from './infrastructure/providers/pharmacy.providers.js';

/**
 * Bounded context "Pharmacy": delivers signed prescriptions, fully or in
 * part (what is missing stays pending), and calls patients with its own
 * "FAR n" turns on the waiting-room screen. It sees prescriptions only,
 * never the clinical note.
 */
@Module({
  imports: [IdentityAccessModule, PatientsModule, SchedulingModule, StaffModule, ConsultationModule, AdmissionModule],
  controllers: [PharmacyController, InventoryController],
  providers: pharmacyProviders,
})
export class PharmacyModule implements OnModuleInit {
  constructor(
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly connection: MongoConnection,
  ) {}

  onModuleInit(): void {
    this.connection.afterConnect('pharmacy indexes', () =>
      Promise.all([ensureDispensationIndexes(this.db), ensureProductIndexes(this.db)]),
    );
  }
}
