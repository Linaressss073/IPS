import { apiFetch, TokenSource } from "./client";

/** Mirrors the views of api/src/contexts/admission/application/types/admission.types.ts. */
export type TurnStatus = "en_espera" | "anunciado" | "atendido" | "no_se_presento";

export type Turn = {
  id: string;
  label: string;
  /** Waiting for an appointment, or to pick up a prescription. */
  origin: { kind: "cita" } | { kind: "farmacia"; consultationId: string };
  code: string;
  number: number;
  status: TurnStatus;
  calls: number;
  lastCalledAt: string | null;
  arrivedAt: string;
  closedAt: string | null;
  date: string;
  appointment: { id: string; time: string };
  patient: {
    id: string;
    fullName: string | null;
    shortName: string | null;
    document: { type: string; number: string } | null;
  };
  professional: { userId: string; displayName: string | null };
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  version: number;
};

export type BoardCall = {
  turnId: string;
  label: string;
  location: string;
  patientName: string | null;
  status: TurnStatus;
  calls: number;
  calledAt: string;
};

export type CallSettings = { announceIntervalSeconds: number; maxCalls: number };

export type Board = { current: BoardCall | null; recent: BoardCall[]; settings: CallSettings };

export const TURN_STATUSES: Record<TurnStatus, string> = {
  en_espera: "En espera",
  anunciado: "Anunciado",
  atendido: "Atendido",
  no_se_presento: "No se presentó",
};

const team = (teamId: string) => `/teams/${encodeURIComponent(teamId)}`;
const json = (body: unknown, method = "POST"): RequestInit => ({ method, body: JSON.stringify(body) });

export const checkIn = (auth: TokenSource, teamId: string, appointmentId: string) =>
  apiFetch<Turn>(auth, `${team(teamId)}/turns`, json({ appointmentId }));

export function listTurns(
  auth: TokenSource,
  teamId: string,
  filter: { date?: string; status?: string; professionalId?: string } = {},
) {
  const params = new URLSearchParams(
    Object.entries(filter).filter((entry): entry is [string, string] => !!entry[1]),
  );
  return apiFetch<Turn[]>(auth, `${team(teamId)}/turns?${params}`);
}

const turnAction = (action: "call" | "attend" | "no-show") => (auth: TokenSource, teamId: string, turn: Turn) =>
  apiFetch<Turn>(
    auth,
    `${team(teamId)}/turns/${encodeURIComponent(turn.id)}/${action}`,
    json({ version: turn.version }),
  );

export const callTurn = turnAction("call");
export const attendTurn = turnAction("attend");
export const markNoShow = turnAction("no-show");

export const getBoard = (auth: TokenSource, teamId: string) => apiFetch<Board>(auth, `${team(teamId)}/turns/board`);

export const getCallSettings = (auth: TokenSource, teamId: string) =>
  apiFetch<CallSettings>(auth, `${team(teamId)}/admission/settings`);

export const updateCallSettings = (auth: TokenSource, teamId: string, settings: CallSettings) =>
  apiFetch<CallSettings>(auth, `${team(teamId)}/admission/settings`, json(settings, "PUT"));
