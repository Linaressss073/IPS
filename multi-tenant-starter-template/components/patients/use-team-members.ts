"use client";

import * as React from "react";
import { useUser } from "@hexclave/next";

export type TeamMember = { id: string; name: string };

/** Members of the team (IPS), to pick "requested by" and to show names instead of user ids. */
export function useTeamMembers(teamId: string): TeamMember[] {
  const user = useUser({ or: "redirect" });
  const team = user.useTeam(teamId);
  const [members, setMembers] = React.useState<TeamMember[]>([]);

  // Keep the latest team in a ref so the effect only re-runs when the team id changes.
  const teamRef = React.useRef(team);
  teamRef.current = team;

  React.useEffect(() => {
    let cancelled = false;
    teamRef.current
      ?.listUsers()
      .then((users) => {
        if (cancelled) return;
        setMembers(
          users.map((member) => ({
            id: member.id,
            name: member.teamProfile.displayName ?? member.id,
          })),
        );
      })
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [team?.id]);

  return members;
}

export function memberName(members: TeamMember[], userId: string) {
  return members.find((member) => member.id === userId)?.name ?? userId;
}
