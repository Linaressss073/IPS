'use client';

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { OrganizationSwitcher, useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Contact, Home } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

const navigationItems: SidebarItem[] = [
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
    <SidebarLayout
      items={navigationItems}
      basePath={`/dashboard/${organization.id}`}
      sidebarTop={
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/dashboard/:id"
          afterCreateOrganizationUrl="/dashboard/:id"
        />
      }
      baseBreadcrumb={[{
        title: organization.name,
        href: `/dashboard/${organization.id}`,
      }]}
    >
      {props.children}
    </SidebarLayout>
  );
}
