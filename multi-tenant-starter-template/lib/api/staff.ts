import { apiFetch, TokenSource } from "./client";

/** Mirrors StaffMemberView from the API: never the full e-mail. */
export type StaffMember = {
  userId: string;
  displayName: string | null;
  emailMasked: string | null;
  providerRole: string;
  roles: string[];
};

/** What the signed-in user may do in the IPS (GET /staff/me). */
export type MyAccess = {
  userId: string;
  isAdmin: boolean;
  roles: string[];
  permissions: string[];
};

export type Permission =
  | "patients:read"
  | "patients:write"
  | "appointments:read"
  | "appointments:manage"
  | "admission:manage"
  | "turns:call"
  | "settings:manage"
  | "staff:manage";

export const ROLE_LABELS: Record<string, string> = {
  agendamiento: "Agendamiento",
  admision: "Admisión",
  medico: "Médico",
  farmacia: "Farmacia",
  soporte: "Soporte",
};

const base = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/staff`;

export function listStaff(auth: TokenSource, teamId: string) {
  return apiFetch<StaffMember[]>(auth, base(teamId));
}

export function getMyAccess(auth: TokenSource, teamId: string) {
  return apiFetch<MyAccess>(auth, `${base(teamId)}/me`);
}

/** Administrators only; `roles` replaces the current set ([] removes all). */
export function assignRoles(auth: TokenSource, teamId: string, userId: string, roles: string[]) {
  return apiFetch<StaffMember>(auth, `${base(teamId)}/${encodeURIComponent(userId)}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}
