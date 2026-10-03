"use client";

import { OrganizationList } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { useClerkAppearance } from "@/lib/clerk-appearance";

/**
 * Entry to the dashboard: every IPS is a Clerk organization. The user picks
 * one of theirs, or creates the first one, and lands on /dashboard/<orgId>.
 */
export function PageClient() {
  const appearance = useClerkAppearance();
  return (
    <AuthShell title="Elige tu IPS" subtitle="O crea la de tu institución para empezar.">
      <OrganizationList
        hidePersonal
        appearance={appearance}
        afterSelectOrganizationUrl="/dashboard/:id"
        afterCreateOrganizationUrl="/dashboard/:id"
      />
    </AuthShell>
  );
}
