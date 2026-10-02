import type { StaffRole } from '../types/staff.types.js';

/** What a staff member may do. Endpoints require one of these. */
export const PERMISSIONS = [
  'patients:read',
  'patients:write',
  'appointments:manage',
  'admission:manage',
  'turns:call',
  'settings:manage',
  'staff:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** The matrix agreed for the project (Administración is Clerk's org:admin). */
export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  agendamiento: ['patients:read', 'patients:write', 'appointments:manage'],
  admision: ['patients:read', 'patients:write', 'admission:manage', 'turns:call'],
  medico: ['patients:read', 'turns:call'],
  farmacia: ['patients:read', 'turns:call'],
  soporte: [],
};

export const ADMIN_PERMISSIONS: readonly Permission[] = [
  'patients:read',
  'patients:write',
  'appointments:manage',
  'admission:manage',
  'settings:manage',
  'staff:manage',
];

/** Union of the permissions of every role the person holds (and admin's). */
export function permissionsFor(input: {
  isAdmin: boolean;
  roles: readonly StaffRole[];
}): Permission[] {
  const granted = new Set<Permission>(input.isAdmin ? ADMIN_PERMISSIONS : []);
  for (const role of input.roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) granted.add(permission);
  }
  return PERMISSIONS.filter((permission) => granted.has(permission));
}
