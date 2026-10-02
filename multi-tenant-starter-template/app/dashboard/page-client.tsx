"use client";

import { OrganizationList } from "@clerk/nextjs";

/**
 * Entry to the dashboard: every IPS is a Clerk organization. The user picks
 * one of theirs, or creates the first one, and lands on /dashboard/<orgId>.
 */
export function PageClient() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Elige tu IPS</h1>
        <p className="text-sm text-muted-foreground">
          O crea la de tu institución para empezar.
        </p>
      </div>
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/dashboard/:id"
        afterCreateOrganizationUrl="/dashboard/:id"
      />
    </div>
  );
}
