import { apiFetch, TokenSource } from "./client";

/** Mirrors OrganizationView from the API (api/src/contexts/organizations/application/types). */
export type Organization = {
  id: string;
  name: string;
  nit: string | null;
  habilitationCode: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

/** Fields left out keep their value; null clears an optional field. */
export type OrganizationChanges = Partial<
  Pick<Organization, "name" | "nit" | "habilitationCode" | "address" | "city" | "department" | "phone" | "email">
>;

const url = (organizationId: string) => `/organizations/${encodeURIComponent(organizationId)}`;

export function getOrganization(auth: TokenSource, organizationId: string) {
  return apiFetch<Organization>(auth, url(organizationId));
}

/** Administrators only; `version` is the one the user saw. */
export function updateOrganization(
  auth: TokenSource,
  organizationId: string,
  version: number,
  changes: OrganizationChanges,
) {
  return apiFetch<Organization>(auth, url(organizationId), {
    method: "PATCH",
    body: JSON.stringify({ ...changes, version }),
  });
}

/** Administrators only: removes everyone's access; clinical records are kept. */
export function deleteOrganization(auth: TokenSource, organizationId: string) {
  return apiFetch<null>(auth, url(organizationId), { method: "DELETE" });
}
