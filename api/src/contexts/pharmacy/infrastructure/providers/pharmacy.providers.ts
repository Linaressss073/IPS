import { Provider } from '@nestjs/common';
import type { Db, MongoClient } from 'mongodb';
import {
  ActorResolver,
  CLOCK,
  Clock,
  type TeamMembers,
} from '../../../../shared/application/index.js';
import { UserId } from '../../../../shared/domain/index.js';
import { MONGO_CLIENT, MONGO_DB } from '../../../../shared/infrastructure/persistence/mongo.js';
import { systemClock } from '../../../../shared/infrastructure/providers/system-clock.js';
import { IssuePharmacyTurn } from '../../../admission/application/commands/admission.commands.js';
import { PrescriptionQueries } from '../../../consultation/application/queries/prescription.queries.js';
import { TEAM_MEMBERSHIP_CHECKER } from '../../../identity-access/application/constants/injection-tokens.js';
import { GetPatientSummaries } from '../../../patients/application/queries/get-patient-summaries.query.js';
import { ListLocations } from '../../../scheduling/application/queries/scheduling.queries.js';
import { GetStaffNames } from '../../../staff/application/queries/get-staff-names.query.js';
import {
  Dispense,
  IssuePharmacyTurnForPrescription,
} from '../../application/commands/pharmacy.commands.js';
import {
  DISPENSATION_REPOSITORY,
  PRODUCT_REPOSITORY,
  PHARMACY_NAMES,
  PHARMACY_TEAM_MEMBERS,
  PHARMACY_TURNS,
  PHARMACY_WINDOWS,
  PRESCRIPTION_SOURCE,
} from '../../application/constants/pharmacy.tokens.js';
import type {
  DispensationRepository,
  PharmacyNames,
  PharmacyTurns,
  PharmacyWindows,
  PrescriptionSource,
  ProductRepository,
} from '../../application/ports/pharmacy.ports.js';
import { PharmacyQueries } from '../../application/queries/pharmacy.queries.js';
import { InventoryQueries } from '../../application/queries/inventory.queries.js';
import {
  AdjustLot,
  CreateProduct,
  ReceiveLot,
  UpdateProduct,
} from '../../application/commands/inventory.commands.js';
import { MongoProductRepository } from '../persistence/mongo-product.js';
import { MongoDispensationRepository } from '../persistence/mongo-dispensation.js';

/** The only place where the pharmacy classes are wired to the framework. */
export const pharmacyProviders: Provider[] = [
  { provide: CLOCK, useValue: systemClock },
  { provide: PHARMACY_TEAM_MEMBERS, useExisting: TEAM_MEMBERSHIP_CHECKER },
  {
    provide: ActorResolver,
    inject: [PHARMACY_TEAM_MEMBERS],
    useFactory: (members: TeamMembers) => new ActorResolver(members),
  },

  // Other contexts, through their public queries and commands.
  {
    provide: PRESCRIPTION_SOURCE,
    inject: [PrescriptionQueries],
    useFactory: (prescriptions: PrescriptionQueries): PrescriptionSource => ({
      list: (teamId, filter) => prescriptions.list(teamId, filter),
      get: (teamId, consultationId) => prescriptions.get(teamId, consultationId),
    }),
  },
  {
    provide: PHARMACY_TURNS,
    inject: [IssuePharmacyTurn],
    useFactory: (issue: IssuePharmacyTurn): PharmacyTurns => ({
      issue: (input) =>
        issue.execute({
          teamId: input.teamId,
          consultationId: input.consultationId,
          patientId: input.patientId,
          window: input.window,
          actor: { executedBy: UserId.of(input.executedBy) },
        }),
    }),
  },
  {
    provide: PHARMACY_WINDOWS,
    inject: [ListLocations],
    useFactory: (locations: ListLocations): PharmacyWindows => ({
      list: (teamId) => locations.execute(teamId),
    }),
  },
  {
    provide: PHARMACY_NAMES,
    inject: [GetPatientSummaries, GetStaffNames],
    useFactory: (patients: GetPatientSummaries, staff: GetStaffNames): PharmacyNames => ({
      patients: (teamId, ids) => patients.execute(teamId, ids),
      staff: (ids) => staff.execute(ids),
    }),
  },

  {
    provide: DISPENSATION_REPOSITORY,
    inject: [MONGO_CLIENT, MONGO_DB],
    useFactory: (client: MongoClient, db: Db) => new MongoDispensationRepository(client, db),
  },
  {
    provide: PharmacyQueries,
    inject: [PRESCRIPTION_SOURCE, DISPENSATION_REPOSITORY, PHARMACY_NAMES, CLOCK],
    useFactory: (
      prescriptions: PrescriptionSource,
      dispensations: DispensationRepository,
      names: PharmacyNames,
      clock: Clock,
    ) => new PharmacyQueries(prescriptions, dispensations, names, clock),
  },
  {
    provide: Dispense,
    inject: [DISPENSATION_REPOSITORY, PRODUCT_REPOSITORY, PRESCRIPTION_SOURCE, PharmacyQueries, ActorResolver, CLOCK],
    useFactory: (
      dispensations: DispensationRepository,
      products: ProductRepository,
      prescriptions: PrescriptionSource,
      queries: PharmacyQueries,
      actors: ActorResolver,
      clock: Clock,
    ) => new Dispense(dispensations, products, prescriptions, queries, actors, clock),
  },

  // Inventory
  {
    provide: PRODUCT_REPOSITORY,
    inject: [MONGO_CLIENT, MONGO_DB],
    useFactory: (client: MongoClient, db: Db) => new MongoProductRepository(client, db),
  },
  {
    provide: InventoryQueries,
    inject: [PRODUCT_REPOSITORY, PHARMACY_NAMES, CLOCK],
    useFactory: (products: ProductRepository, names: PharmacyNames, clock: Clock) =>
      new InventoryQueries(products, names, clock),
  },
  {
    provide: CreateProduct,
    inject: [PRODUCT_REPOSITORY, InventoryQueries, CLOCK],
    useFactory: (products: ProductRepository, queries: InventoryQueries, clock: Clock) =>
      new CreateProduct(products, queries, clock),
  },
  {
    provide: UpdateProduct,
    inject: [PRODUCT_REPOSITORY, InventoryQueries, CLOCK],
    useFactory: (products: ProductRepository, queries: InventoryQueries, clock: Clock) =>
      new UpdateProduct(products, queries, clock),
  },
  {
    provide: ReceiveLot,
    inject: [PRODUCT_REPOSITORY, InventoryQueries, ActorResolver, CLOCK],
    useFactory: (products: ProductRepository, queries: InventoryQueries, actors: ActorResolver, clock: Clock) =>
      new ReceiveLot(products, queries, actors, clock),
  },
  {
    provide: AdjustLot,
    inject: [PRODUCT_REPOSITORY, InventoryQueries, ActorResolver, CLOCK],
    useFactory: (products: ProductRepository, queries: InventoryQueries, actors: ActorResolver, clock: Clock) =>
      new AdjustLot(products, queries, actors, clock),
  },
  {
    provide: IssuePharmacyTurnForPrescription,
    inject: [PRESCRIPTION_SOURCE, PharmacyQueries, PHARMACY_WINDOWS, PHARMACY_TURNS, ActorResolver],
    useFactory: (
      prescriptions: PrescriptionSource,
      queries: PharmacyQueries,
      windows: PharmacyWindows,
      turns: PharmacyTurns,
      actors: ActorResolver,
    ) => new IssuePharmacyTurnForPrescription(prescriptions, queries, windows, turns, actors),
  },
];
