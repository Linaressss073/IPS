import { apiFetch, TokenSource } from "./client";

/** Mirrors PatientView from the API (api/src/contexts/patients/application/types/patient.types.ts). */
export type Patient = {
  id: string;
  document: { type: string; number: string };
  name: {
    firstName: string;
    middleName: string | null;
    firstLastName: string;
    secondLastName: string | null;
  };
  fullName: string;
  birthDate: string;
  sex: string;
  contact: { email: string; phone: string | null; address: string | null };
  affiliation: { eps: string | null; regime: string };
  version: number;
  registeredAt: string;
  updatedAt: string;
};

export type PatientInput = {
  document: Patient["document"];
  name: Patient["name"];
  birthDate: string;
  sex: string;
  contact: Patient["contact"];
  affiliation: Patient["affiliation"];
  /** Optional first companion, recorded as #1 (registration only). */
  companion?: CompanionInput | null;
  /** User who asked for the change; the API defaults it to the caller. */
  requestedBy?: string;
};

/** Every field optional, but the API requires a name or a phone. */
export type CompanionInput = {
  relationship?: string | null;
  name?: Patient["name"] | null;
  document?: Patient["document"] | null;
  phone?: string | null;
  email?: string | null;
};

/** Mirrors CompanionView from the API; `number` grows with each companion. */
export type Companion = {
  number: number;
  relationship: string | null;
  name: Patient["name"] | null;
  fullName: string | null;
  document: Patient["document"] | null;
  phone: string | null;
  email: string | null;
  recordedAt: string;
  requestedBy: string;
  executedBy: string;
};

export type TimelineEntry = {
  id: string;
  type: string;
  occurredAt: string;
  requestedBy: string;
  executedBy: string;
  data: Record<string, unknown>;
};

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export const DOCUMENT_TYPES: Record<string, string> = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  TI: "Tarjeta de identidad",
  RC: "Registro civil",
  NIT: "NIT",
  PA: "Pasaporte",
  PPT: "Permiso por protección temporal",
  PEP: "Permiso especial de permanencia",
  CD: "Carné diplomático",
  SC: "Salvoconducto",
  CN: "Certificado de nacido vivo",
  AS: "Adulto sin identificación",
  MS: "Menor sin identificación",
};

export const SEXES: Record<string, string> = {
  H: "Hombre",
  M: "Mujer",
  I: "Indeterminado",
};

export const REGIMES: Record<string, string> = {
  contributivo: "Contributivo",
  subsidiado: "Subsidiado",
  especial: "Especial",
  particular: "Particular",
};

export const RELATIONSHIPS: Record<string, string> = {
  madre: "Madre",
  padre: "Padre",
  hijo: "Hijo/a",
  conyuge: "Cónyuge",
  hermano: "Hermano/a",
  familiar: "Otro familiar",
  cuidador: "Cuidador/a",
  otro: "Otro",
};

export const TIMELINE_EVENTS: Record<string, string> = {
  "patient.registered": "Paciente registrado",
  "patient.updated": "Datos actualizados",
  "patient.companion_recorded": "Acompañante registrado",
};

const base = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/patients`;

export function searchPatients(
  auth: TokenSource,
  teamId: string,
  options: { q?: string; page?: number; pageSize?: number } = {},
) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  const query = params.toString();
  return apiFetch<Page<Patient>>(auth, `${base(teamId)}${query ? `?${query}` : ""}`);
}

export function getPatient(auth: TokenSource, teamId: string, patientId: string) {
  return apiFetch<Patient>(auth, `${base(teamId)}/${encodeURIComponent(patientId)}`);
}

export function getPatientTimeline(auth: TokenSource, teamId: string, patientId: string) {
  return apiFetch<TimelineEntry[]>(
    auth,
    `${base(teamId)}/${encodeURIComponent(patientId)}/timeline`,
  );
}

export function registerPatient(auth: TokenSource, teamId: string, input: PatientInput) {
  return apiFetch<Patient>(auth, base(teamId), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** `version` is the one the user saw; the API rejects the update if it changed since. */
export function updatePatient(
  auth: TokenSource,
  teamId: string,
  patientId: string,
  version: number,
  input: Partial<PatientInput>,
) {
  return apiFetch<Patient>(auth, `${base(teamId)}/${encodeURIComponent(patientId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...input, version }),
  });
}

/** The patient's companions, most recent (highest number) first. */
export function getCompanions(auth: TokenSource, teamId: string, patientId: string) {
  return apiFetch<{ history: Companion[] }>(
    auth,
    `${base(teamId)}/${encodeURIComponent(patientId)}/companions`,
  );
}

export function recordCompanion(
  auth: TokenSource,
  teamId: string,
  patientId: string,
  input: CompanionInput & { requestedBy?: string },
) {
  return apiFetch<Companion>(auth, `${base(teamId)}/${encodeURIComponent(patientId)}/companions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Age in completed years from a YYYY-MM-DD birth date. */
export function ageFrom(birthDate: string, now = new Date()) {
  const [year, month, day] = birthDate.split("-").map(Number);
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) {
    age -= 1;
  }
  return age;
}
