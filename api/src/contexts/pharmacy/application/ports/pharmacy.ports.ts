import { TraceEvent } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { Dispensation, DispensationId } from '../../domain/entities/dispensation.entity.js';
import { Product, ProductId } from '../../domain/entities/product.entity.js';
import { Movement } from '../../domain/types/pharmacy.types.js';

/** Port (write side); every write stores its trace events atomically. */
export interface DispensationRepository {
  /** Dispensations of these consultations (those that have one). */
  findMany(teamId: TeamId, consultationIds: readonly string[]): Promise<Dispensation[]>;
  exists(teamId: TeamId, id: DispensationId): Promise<boolean>;
  /**
   * Stores a delivery in one transaction: the dispensation, the products it
   * took stock from and their kardex lines. Throws
   * DispensationVersionConflictError / StockChangedError if either changed.
   */
  saveDelivery(
    dispensation: Dispensation,
    products: readonly Product[],
    movements: readonly Movement[],
    events: readonly TraceEvent[],
  ): Promise<void>;
  /** Throws if the team has none for this consultation: check `exists` first. */
  getById(teamId: TeamId, id: DispensationId): Promise<Dispensation>;
}

/** A signed prescription, as the Consultation context lets the pharmacy see it. */
export interface SourcePrescription {
  consultationId: string;
  patientId: string;
  physicianId: string;
  date: string;
  signedAt: string;
  items: {
    medication: string;
    presentation: string;
    dose: string;
    route: string;
    frequency: string;
    durationDays: number;
    quantity: number;
    instructions: string;
  }[];
}

/** Port to Consultation (throws PRESCRIPTION_NOT_FOUND unless signed with medications). */
export interface PrescriptionSource {
  list(teamId: TeamId, filter: { date?: string; patientId?: string }): Promise<SourcePrescription[]>;
  get(teamId: TeamId, consultationId: string): Promise<SourcePrescription>;
}

/** Port to Admission: the pharmacy's "FAR n" turns on the waiting-room screen. */
export interface PharmacyTurns {
  issue(input: {
    teamId: TeamId;
    consultationId: string;
    patientId: string;
    window: { id: string; label: string };
    executedBy: string;
  }): Promise<{ id: string; label: string; location: { label: string } }>;
}

/** Port to Scheduling: pharmacy windows are active locations (e.g. "Farmacia 1"). */
export interface PharmacyWindows {
  list(teamId: TeamId): Promise<{ id: string; label: string; active: boolean }[]>;
}

/** Port to Patients and Staff. */
export interface PharmacyNames {
  patients(teamId: TeamId, ids: readonly string[]): Promise<Map<string, { fullName: string; document: { type: string; number: string } }>>;
  staff(ids: readonly string[]): Promise<Map<string, string>>;
}

/** Port: the pharmacy's catalog and stock; every change stores its kardex lines atomically. */
export interface ProductRepository {
  /** Throws ProductNotFoundError. */
  getById(teamId: TeamId, id: ProductId): Promise<Product>;
  list(teamId: TeamId): Promise<Product[]>;
  /** Throws ProductTakenError if name + presentation exists in the team. */
  add(product: Product): Promise<void>;
  /** Throws StockChangedError if it changed since loaded. */
  save(product: Product, movements: readonly Movement[]): Promise<void>;
  /** The product's kardex, newest first. */
  movements(teamId: TeamId, id: ProductId): Promise<Movement[]>;
}
