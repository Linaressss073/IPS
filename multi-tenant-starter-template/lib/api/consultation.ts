import { apiFetch, TokenSource } from "./client";

/** Mirrors api/src/contexts/consultation/application/types/consultation.types.ts. */
export type Note = { reason: string; currentIllness: string; physicalExam: string; plan: string };
export type VitalSign = { name: VitalSignName; value: number };
export type Diagnosis = { code: string; description: string; principal: boolean };
export type PrescriptionItem = {
  medication: string;
  presentation: string;
  dose: string;
  route: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions: string;
};

export type Consultation = {
  id: string;
  status: "en_curso" | "firmada";
  signature: { signed: false } | { signed: true; at: string };
  patient: { id: string; fullName: string; document: { type: string; number: string } };
  physician: { userId: string; displayName: string };
  appointment: { id: string; date: string; time: string };
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  note: Note;
  vitals: (VitalSign & { unit: string })[];
  bmi: number[];
  diagnoses: Diagnosis[];
  prescription: PrescriptionItem[];
  addenda: { text: string; writtenBy: string; writtenByName: string; writtenAt: string }[];
  startedAt: string;
  updatedAt: string;
  version: number;
};

/** Same names, units and ranges as the API (VITAL_SIGNS). */
export const VITAL_SIGNS = {
  presion_sistolica: { label: "Presión sistólica", unit: "mmHg", min: 50, max: 260, step: 1 },
  presion_diastolica: { label: "Presión diastólica", unit: "mmHg", min: 30, max: 160, step: 1 },
  frecuencia_cardiaca: { label: "Frecuencia cardiaca", unit: "lpm", min: 20, max: 250, step: 1 },
  frecuencia_respiratoria: { label: "Frecuencia respiratoria", unit: "rpm", min: 5, max: 80, step: 1 },
  temperatura: { label: "Temperatura", unit: "°C", min: 30, max: 45, step: 0.1 },
  saturacion_oxigeno: { label: "Saturación de oxígeno", unit: "%", min: 50, max: 100, step: 1 },
  peso: { label: "Peso", unit: "kg", min: 0.3, max: 400, step: 0.1 },
  talla: { label: "Talla", unit: "cm", min: 20, max: 250, step: 1 },
} as const;
export type VitalSignName = keyof typeof VITAL_SIGNS;

export const ROUTES: Record<string, string> = {
  oral: "Oral",
  sublingual: "Sublingual",
  intravenosa: "Intravenosa",
  intramuscular: "Intramuscular",
  subcutanea: "Subcutánea",
  topica: "Tópica",
  inhalada: "Inhalada",
  oftalmica: "Oftálmica",
  otica: "Ótica",
  nasal: "Nasal",
  rectal: "Rectal",
  vaginal: "Vaginal",
  transdermica: "Transdérmica",
};

const base = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/consultations`;
const json = (body: unknown, method = "POST"): RequestInit => ({ method, body: JSON.stringify(body) });

/** Opens the appointment's consultation (or the one already open). */
export const startConsultation = (auth: TokenSource, teamId: string, appointmentId: string) =>
  apiFetch<Consultation>(auth, base(teamId), json({ appointmentId }));

export const getConsultation = (auth: TokenSource, teamId: string, id: string) =>
  apiFetch<Consultation>(auth, `${base(teamId)}/${encodeURIComponent(id)}`);

export const listPatientConsultations = (auth: TokenSource, teamId: string, patientId: string) =>
  apiFetch<Consultation[]>(auth, `${base(teamId)}?patientId=${encodeURIComponent(patientId)}`);

export const saveConsultation = (
  auth: TokenSource,
  teamId: string,
  consultation: Consultation,
  draft: { note: Note; vitals: VitalSign[]; diagnoses: Diagnosis[]; prescription: PrescriptionItem[] },
) =>
  apiFetch<Consultation>(
    auth,
    `${base(teamId)}/${encodeURIComponent(consultation.id)}`,
    json({ version: consultation.version, ...draft }, "PATCH"),
  );

export const signConsultation = (auth: TokenSource, teamId: string, consultation: Consultation) =>
  apiFetch<Consultation>(
    auth,
    `${base(teamId)}/${encodeURIComponent(consultation.id)}/sign`,
    json({ version: consultation.version }),
  );

export const addAddendum = (auth: TokenSource, teamId: string, consultation: Consultation, text: string) =>
  apiFetch<Consultation>(
    auth,
    `${base(teamId)}/${encodeURIComponent(consultation.id)}/addenda`,
    json({ version: consultation.version, text }),
  );
