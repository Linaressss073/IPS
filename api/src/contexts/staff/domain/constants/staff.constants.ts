/**
 * Functional roles of a staff member inside an IPS. A person may hold
 * several. Administrators are not a role here: they come from the identity
 * provider (Clerk's org:admin) and get every management permission.
 */
export const STAFF_ROLES = [
  'agendamiento',
  'admision',
  'medico',
  'farmacia',
  'soporte',
] as const;

/** Shown instead of a name once the user was deleted and anonymized. */
export const DELETED_USER_NAME = 'Usuario eliminado';

export const DISPLAY_NAME_MAX_LENGTH = 120;

/** Leading characters kept visible when masking an e-mail (see maskEmail). */
export const EMAIL_LOCAL_VISIBLE_CHARS = 3;
export const EMAIL_DOMAIN_VISIBLE_CHARS = 3;
