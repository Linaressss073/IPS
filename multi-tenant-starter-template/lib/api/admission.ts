import { apiFetch, TokenSource } from "./client";
import type { components } from "./schema";

type Schemas = components["schemas"];

/** The views come from the API's OpenAPI document (pnpm api:types); only the status is narrowed here. */
export type TurnStatus = "en_espera" | "anunciado" | "atendido" | "no_se_presento";

export type Turn = Omit<Schemas["TurnView"], "status"> & { status: TurnStatus };

export type BoardCall = Omit<Schemas["BoardCall"], "status"> & { status: TurnStatus };

export type CallSettings = Schemas["CallSettingsView"];

export type Board = Omit<Schemas["BoardView"], "current" | "recent"> & {
  current: BoardCall | null;
  recent: BoardCall[];
};

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
