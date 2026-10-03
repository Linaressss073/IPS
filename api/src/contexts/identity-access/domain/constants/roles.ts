/** Team role allowed to change or delete the team (IPS) itself. */
export const TEAM_ADMIN_ROLE = 'admin';

/**
 * Clerk sends roles as "org:admin" in some places and "admin" in others.
 * Returns the role without the prefix, or no role for an empty value.
 */
export function normalizeRole(role: unknown): string[] {
  const value = typeof role === 'string' ? role.trim().replace(/^org:/, '') : '';
  return value ? [value] : [];
}
