import { ActorInput } from '../../../../shared/application/index.js';
import { TeamId } from '../../../../shared/domain/index.js';
import { DeliveryLine, DispensationStatus } from '../../domain/types/pharmacy.types.js';

export interface DispenseCommand {
  teamId: TeamId;
  consultationId: string;
  /** The version the client saw: 0 before the first delivery. */
  expectedVersion: number;
  lines: DeliveryLine[];
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
    lines: { index: number; medication: string; quantity: number }[];
    note: string;
  }[];
  version: number;
}
