import { apiFetch, TokenSource } from "./client";
import { Turn } from "./admission";

/** Mirrors PharmacyPrescriptionView (api/src/contexts/pharmacy/application/types). */
export type DispensationStatus = "pendiente" | "parcial" | "completa";

export type PharmacyPrescription = {
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
};

export const DISPENSATION_STATUSES: Record<DispensationStatus, string> = {
  pendiente: "Pendiente",
  parcial: "Entrega parcial",
  completa: "Entregada",
};

const base = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/pharmacy/prescriptions`;

export function listPrescriptions(
  auth: TokenSource,
  teamId: string,
  filter: { date?: string; patientId?: string; status?: string },
) {
  const params = new URLSearchParams(
    Object.entries(filter).filter((entry): entry is [string, string] => !!entry[1]),
  );
  return apiFetch<PharmacyPrescription[]>(auth, `${base(teamId)}?${params}`);
}

export const deliver = (
  auth: TokenSource,
  teamId: string,
  prescription: PharmacyPrescription,
  lines: { index: number; quantity: number }[],
  note: string,
) =>
  apiFetch<PharmacyPrescription>(auth, `${base(teamId)}/${encodeURIComponent(prescription.consultationId)}/deliveries`, {
    method: "POST",
    body: JSON.stringify({ version: prescription.version, lines, note }),
  });

export const issuePharmacyTurn = (auth: TokenSource, teamId: string, consultationId: string, windowId: string) =>
  apiFetch<Turn>(auth, `${base(teamId)}/${encodeURIComponent(consultationId)}/turn`, {
    method: "POST",
    body: JSON.stringify({ windowId }),
  });
