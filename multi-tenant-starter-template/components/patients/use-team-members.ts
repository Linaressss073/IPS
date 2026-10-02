"use client";

import { useOrganization } from "@clerk/nextjs";

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
    return [{ id: user.userId, name: fullName || user.identifier || user.userId }];
  });
}

export function memberName(members: TeamMember[], userId: string) {
  return members.find((member) => member.id === userId)?.name ?? userId;
}
