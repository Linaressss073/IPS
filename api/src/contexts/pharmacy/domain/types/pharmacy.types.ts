import { DISPENSATION_STATUSES, MOVEMENT_TYPES } from '../constants/pharmacy.constants.js';

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type DispensationStatus = (typeof DISPENSATION_STATUSES)[number];

/** A medication as prescribed (from the signed consultation). */
export interface PrescribedItem {
  medication: string;
  presentation: string;
  dose: string;
  route: string;
  frequency: string;
  durationDays: number;
  /** Units prescribed. */
  prescribed: number;
}

export interface DispensedItemProps extends PrescribedItem {
  /** Position in the prescription. */
  index: number;
  delivered: number;
}

export interface DeliveryLine {
  index: number;
  quantity: number;
}

/** Units taken from one lot (FEFO), recorded for traceability. */
export interface LotAllocation {
  lotNumber: string;
  expiresOn: string;
  quantity: number;
}

/** A delivered line: which catalog product and which lots. */
export interface DeliveredLine extends DeliveryLine {
  productId: string;
  lots: LotAllocation[];
}

/** Why stock moved: what the kardex shows. */
export type MovementReference =
  | { kind: 'recepcion'; supplier: string }
  | { kind: 'dispensacion'; consultationId: string }
  | { kind: 'ajuste'; reason: string };

/** One line of a product's kardex: append-only. */
export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  lotNumber: string;
  /** Positive for entries, negative for outputs. */
  quantity: number;
  reference: MovementReference;
  at: Date;
  by: string;
}

export interface LotProps {
  lotNumber: string;
  /** YYYY-MM-DD */
  expiresOn: string;
  quantity: number;
  receivedAt: Date;
}

export interface DeliveryProps {
  at: Date;
  /** User who delivered. */
  by: string;
  lines: DeliveredLine[];
  note: string;
}
