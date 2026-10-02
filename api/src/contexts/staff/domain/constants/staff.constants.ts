/**
 * Role of a staff member inside an IPS, independent of the identity
 * provider's own roles (e.g. Clerk's org:admin / org:member). Stored now,
 * enforced by the modules that need it later.
 */
export const CLINICAL_ROLES = [
  'administrador',
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
