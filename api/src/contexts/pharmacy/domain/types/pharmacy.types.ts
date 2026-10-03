import { DISPENSATION_STATUSES } from '../constants/pharmacy.constants.js';

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

export interface DeliveryProps {
  at: Date;
  /** User who delivered. */
  by: string;
  lines: DeliveryLine[];
  note: string;
}
