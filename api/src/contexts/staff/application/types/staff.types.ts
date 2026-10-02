import { TeamId } from '../../../../shared/domain/index.js';
import { StaffProfile } from '../../domain/entities/staff-profile.vo.js';

/**
 * A change in the identity provider, already translated to our language by
 * an anti-corruption adapter (webhooks or the bulk sync).
 */
export type IdentityChange =
  | { kind: 'user.upserted'; profile: StaffProfile }
  | { kind: 'user.deleted'; userId: string }
  | {
      kind: 'membership.upserted';
      teamId: TeamId;
      userId: string;
      providerRole: string;
      sourceUpdatedAt: Date;
      /** Profile carried by the membership, used only if we do not know the user yet. */
      profile: StaffProfile | null;
    }
  | { kind: 'membership.deleted'; teamId: TeamId; userId: string }
  | { kind: 'team.deleted'; teamId: TeamId };

/** A member of an IPS, as shown to the other members (no full e-mail). */
export interface StaffMemberView {
  userId: string;
  displayName: string | null;
  emailMasked: string | null;
  providerRole: string;
  /** Functional roles assigned by the IPS administrators. */
  roles: string[];
}

/** What the caller may do in an IPS (for the UI to show only that). */
export interface MyAccessView {
  userId: string;
  isAdmin: boolean;
  roles: string[];
  permissions: string[];
}
