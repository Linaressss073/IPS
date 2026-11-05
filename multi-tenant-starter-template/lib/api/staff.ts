import { apiFetch, TokenSource } from "./client";
import type { components } from "./schema";

/** Never the full e-mail. Generated from the API's OpenAPI document (pnpm api:types). */
export type StaffMember = components["schemas"]["StaffMemberView"];

/** What the signed-in user may do in the IPS (GET /staff/me). */
export type MyAccess = components["schemas"]["MyAccessView"];

export type Permission = components["schemas"]["Permission"];
export type StaffRole = components["schemas"]["StaffRole"];

export const ROLE_LABELS: Record<StaffRole, string> = {
  agendamiento: "Agendamiento",
  admision: "Admisión",
  medico: "Médico",
  farmacia: "Farmacia",
  soporte: "Soporte",
  tv: "TV de sala",
};

const base = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/staff`;

export function listStaff(auth: TokenSource, teamId: string) {
  return apiFetch<StaffMember[]>(auth, base(teamId));
}

export function getMyAccess(auth: TokenSource, teamId: string) {
  return apiFetch<MyAccess>(auth, `${base(teamId)}/me`);
}

/** Administrators only; `roles` replaces the current set ([] removes all). */
export function assignRoles(auth: TokenSource, teamId: string, userId: string, roles: StaffRole[]) {
  return apiFetch<StaffMember>(auth, `${base(teamId)}/${encodeURIComponent(userId)}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}
