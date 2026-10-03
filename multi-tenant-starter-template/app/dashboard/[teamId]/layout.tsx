'use client';

import { AccessProvider, useAccess } from "@/components/access/access-context";
import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { useClerkAppearance } from "@/lib/clerk-appearance";
import { Permission } from "@/lib/api/staff";
import { OrganizationSwitcher, useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Building2, CalendarDays, Contact, Home, Stethoscope, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

/** Each item is shown only if the user's roles grant `requires`. */
const navigationItems: (SidebarItem & { requires?: Permission })[] = [
  {
    name: "Inicio",
    href: "/",
    icon: Home,
    type: "item",
  },
  {
    type: 'label',
    name: 'Consulta externa',
  },
  {
    name: "Pacientes",
    href: "/patients",
    icon: Contact,
    type: "item",
    requires: "patients:read",
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
    type: "item",
    requires: "appointments:read",
  },
  {
    type: 'label',
    name: 'Administración',
  },
  {
    name: "Personal",
    href: "/staff",
    icon: Users,
    type: "item",
    requires: "staff:manage",
  },
  {
    name: "Servicios y consultorios",
    href: "/scheduling-settings",
    icon: Stethoscope,
    type: "item",
    requires: "settings:manage",
  },
  {
    name: "Datos de la IPS",
    href: "/settings",
    icon: Building2,
    type: "item",
  },
];

export default function Layout(props: { children: React.ReactNode }) {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const { organization, isLoaded } = useOrganization();
  const { setActive, isLoaded: listLoaded } = useOrganizationList();

  // The middleware makes the URL's organization active; if it is not yet
  // (e.g. client-side navigation), activate it here. Failing means the user
  // is not a member of that IPS, so send them back to pick one.
  React.useEffect(() => {
    if (!isLoaded || !listLoaded || organization?.id === teamId) return;
    setActive({ organization: teamId }).catch(() => router.replace("/dashboard"));
  }, [isLoaded, listLoaded, organization?.id, teamId, setActive, router]);

  if (!organization || organization.id !== teamId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loader" />
      </div>
    );
  }

  return (
    <AccessProvider teamId={organization.id}>
      <TeamShell teamId={organization.id} teamName={organization.name}>
        {props.children}
      </TeamShell>
    </AccessProvider>
  );
}

function TeamShell(props: { teamId: string; teamName: string; children: React.ReactNode }) {
  const { can } = useAccess();
  const appearance = useClerkAppearance();
  const items = navigationItems.filter((item) => !item.requires || can(item.requires));

  return (
    <SidebarLayout
      items={items}
      basePath={`/dashboard/${props.teamId}`}
      sidebarTop={
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            ...appearance,
            elements: { rootBox: "w-full", organizationSwitcherTrigger: "w-full justify-between" },
          }}
          afterSelectOrganizationUrl="/dashboard/:id"
          afterCreateOrganizationUrl="/dashboard/:id"
        />
      }
      baseBreadcrumb={[{
        title: props.teamName,
        href: `/dashboard/${props.teamId}`,
      }]}
    >
      {props.children}
    </SidebarLayout>
  );
}
