"use client";

import { useOrganization } from "@clerk/nextjs";
import { maskEmail } from "@/lib/mask-email";

export type TeamMember = { id: string; name: string };

/**
 * Members of the active organization (the IPS in the URL, see the dashboard
 * layout), to pick "requested by" and to show names instead of user ids.
 */
export function useTeamMembers(): TeamMember[] {
  const { memberships } = useOrganization({ memberships: { pageSize: 100 } });

  return (memberships?.data ?? []).flatMap((membership) => {
    const user = membership.publicUserData;
    if (!user?.userId) return [];
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    // Never the raw e-mail: without a name, show it masked.
    return [{ id: user.userId, name: fullName || maskEmail(user.identifier ?? "") || user.userId }];
  });
}

/**
 * Name to show for a user: the one the API resolved (it also knows deleted,
 * anonymized users), else the live Clerk member, else the raw id.
 */
export function memberName(members: TeamMember[], userId: string, apiName?: string | null) {
  return apiName ?? members.find((member) => member.id === userId)?.name ?? userId;
}
