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
    lines: {
      index: number;
      medication: string;
      quantity: number;
      /** Empty for deliveries made before the inventory existed. */
      productId: string;
      lots: { lotNumber: string; expiresOn: string; quantity: number }[];
    }[];
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
  lines: { index: number; quantity: number; productId: string }[],
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

/** Mirrors ProductView and MovementView: the pharmacy's catalog, lots and kardex. */
export type LotStatus = "vigente" | "por_vencer" | "vencido";
export type StockAlert = "stock_bajo" | "por_vencer" | "vencido";

export type Product = {
  id: string;
  name: string;
  presentation: string;
  label: string;
  minStock: number;
  active: boolean;
  available: number;
  expired: number;
  lots: { lotNumber: string; expiresOn: string; quantity: number; status: LotStatus }[];
  alerts: StockAlert[];
  version: number;
};

export type MovementReference =
  | { kind: "recepcion"; supplier: string }
  | { kind: "dispensacion"; consultationId: string }
  | { kind: "ajuste"; reason: string };

export type Movement = {
  id: string;
  type: "entrada" | "salida" | "ajuste";
  lotNumber: string;
  quantity: number;
  reference: MovementReference;
  at: string;
  by: string;
  byName: string;
};

export const STOCK_ALERTS: Record<StockAlert, string> = {
  stock_bajo: "Stock bajo",
  por_vencer: "Por vencer",
  vencido: "Vencidos en stock",
};

export const LOT_STATUSES: Record<LotStatus, string> = {
  vigente: "Vigente",
  por_vencer: "Por vencer",
  vencido: "Vencido",
};

const products = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/pharmacy/products`;

export const listProducts = (auth: TokenSource, teamId: string) => apiFetch<Product[]>(auth, products(teamId));

export const createProduct = (
  auth: TokenSource,
  teamId: string,
  input: { name: string; presentation: string; minStock: number },
) => apiFetch<Product>(auth, products(teamId), { method: "POST", body: JSON.stringify(input) });

export const updateProduct = (
  auth: TokenSource,
  teamId: string,
  productId: string,
  changes: { minStock?: number; active?: boolean },
) =>
  apiFetch<Product>(auth, `${products(teamId)}/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });

export const receiveLot = (
  auth: TokenSource,
  teamId: string,
  productId: string,
  input: { lotNumber: string; expiresOn: string; quantity: number; supplier: string },
) =>
  apiFetch<Product>(auth, `${products(teamId)}/${encodeURIComponent(productId)}/lots`, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const adjustLot = (
  auth: TokenSource,
  teamId: string,
  productId: string,
  input: { lotNumber: string; quantity: number; reason: string },
) =>
  apiFetch<Product>(auth, `${products(teamId)}/${encodeURIComponent(productId)}/adjustments`, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const listMovements = (auth: TokenSource, teamId: string, productId: string) =>
  apiFetch<Movement[]>(auth, `${products(teamId)}/${encodeURIComponent(productId)}/movements`);

const norm = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Active products named like the prescribed medication, same presentation first (empty if none). */
export function matchingProducts(catalog: Product[], medication: string, presentation: string): Product[] {
  const samePresentation = (product: Product) => Number(norm(product.presentation) === norm(presentation));
  return catalog
    .filter((product) => product.active && norm(product.name) === norm(medication))
    .sort((a, b) => samePresentation(b) - samePresentation(a));
}
