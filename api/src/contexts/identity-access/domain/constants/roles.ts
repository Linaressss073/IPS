/** Team role allowed to change or delete the team (IPS) itself. */
export const TEAM_ADMIN_ROLE = 'admin';

/** Clerk sends roles as "org:admin" in some places and "admin" in others. */
export function normalizeRole(role: string | null | undefined): string | null {
  const value = role?.trim().replace(/^org:/, '');
  return value || null;
}
