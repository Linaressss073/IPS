import { ActorInput } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { DispensationStatus, MovementReference, MovementType } from '../../domain/types/pharmacy.types.js';

export interface DispenseCommand {
  teamId: TeamId;
  consultationId: string;
  /** The version the client saw: 0 before the first delivery. */
  expectedVersion: number;
  /** Each line says which catalog product the units come from. */
  lines: { index: number; quantity: number; productId: string }[];
  note: string;
  actor: ActorInput;
}

export interface IssueTurnCommand {
  teamId: TeamId;
  consultationId: string;
  windowId: string;
  actor: ActorInput;
}

/** A signed prescription (as the pharmacy may see it) and what was delivered of it. */
export interface PharmacyPrescriptionView {
  consultationId: string;
  patient: { id: string; fullName: string; document: { type: string; number: string } };
  physician: { userId: string; displayName: string };
  date: string;
  signedAt: string;
  status: DispensationStatus;
  items: {
    index: number;
    medication: string;
    presentation: string;
    dose: string;
    route: string;
    frequency: string;
    durationDays: number;
    instructions: string;
    prescribed: number;
    delivered: number;
    pending: number;
  }[];
  deliveries: {
    at: string;
    by: string;
    byName: string;
    lines: {
      index: number;
      medication: string;
      quantity: number;
      productId: string;
      lots: { lotNumber: string; expiresOn: string; quantity: number }[];
    }[];
    note: string;
  }[];
  version: number;
}

export type LotStatus = 'vigente' | 'por_vencer' | 'vencido';
export type StockAlert = 'stock_bajo' | 'por_vencer' | 'vencido';

/** A catalog product with its stock as of today (Colombia). */
export interface ProductView {
  id: string;
  name: string;
  presentation: string;
  label: string;
  minStock: number;
  active: boolean;
  /** Units that can be dispensed (not expired). */
  available: number;
  /** Units in expired lots, to write off. */
  expired: number;
  lots: { lotNumber: string; expiresOn: string; quantity: number; status: LotStatus }[];
  alerts: StockAlert[];
  version: number;
}

export interface MovementView {
  id: string;
  type: MovementType;
  lotNumber: string;
  quantity: number;
  reference: MovementReference;
  at: string;
  by: string;
  byName: string;
}
