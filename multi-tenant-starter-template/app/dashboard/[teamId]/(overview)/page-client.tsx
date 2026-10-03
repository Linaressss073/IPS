"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Contact,
  ListOrdered,
  MonitorPlay,
  type LucideIcon,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useAccess } from "@/components/access/access-context";
import { PageHeader, PageShell } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Permission, ROLE_LABELS } from "@/lib/api/staff";

type Shortcut = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Shown if the user's roles grant one of these. */
  requires?: Permission[];
  /** Green tile for the main action of the area; blue for the rest. */
  main?: boolean;
};

const SHORTCUTS: Shortcut[] = [
  {
    href: "/patients/new",
    icon: UserPlus,
    title: "Registrar paciente",
    description: "Una sola vez: todas las áreas usarán sus datos.",
    requires: ["patients:write"],
    main: true,
  },
  {
    href: "/patients",
    icon: Contact,
    title: "Pacientes",
    description: "Busca por documento o nombre y abre su ficha e historial.",
    requires: ["patients:read"],
  },
  {
    href: "/agenda",
    icon: CalendarDays,
    title: "Agenda",
    description: "Cupos del día por profesional; agenda, confirma y reprograma.",
    requires: ["appointments:read"],
    main: true,
  },
  {
    href: "/admission",
    icon: ClipboardCheck,
    title: "Admisión",
    description: "Registra la llegada de las citas de hoy: cada paciente recibe su turno.",
    requires: ["admission:manage"],
    main: true,
  },
  {
    href: "/turns",
    icon: ListOrdered,
    title: "Turnos",
    description: "Llama al siguiente paciente y márcalo como atendido.",
    requires: ["turns:call", "admission:manage"],
    main: true,
  },
  {
    href: "/turns/screen",
    icon: MonitorPlay,
    title: "Pantalla de sala",
    description: "Abre en el televisor de la sala: muestra y anuncia los llamados.",
  },
  {
    href: "/staff",
    icon: Users,
    title: "Personal",
    description: "Asigna los roles de quienes trabajan en la IPS.",
    requires: ["staff:manage"],
  },
  {
    href: "/scheduling-settings",
    icon: Stethoscope,
    title: "Servicios y consultorios",
    description: "Servicios con su prefijo de turno y lugares de atención.",
    requires: ["settings:manage"],
  },
  {
    href: "/settings",
    icon: Building2,
    title: "Datos de la IPS",
    description: "NIT, código de habilitación y contacto de la institución.",
  },
];

/** Overview of the IPS: shortcuts to what the user's roles allow. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const { access, can } = useAccess();
  const shortcuts = SHORTCUTS.filter((s) => !s.requires || s.requires.some(can));
  const roles = access?.roles.map((role) => ROLE_LABELS[role] ?? role) ?? [];
  if (access?.isAdmin) roles.unshift("Administrador");

  return (
    <PageShell>
      <PageHeader
        eyebrow="Panel de la IPS"
        title="Inicio"
        description={
          access === null
            ? "Cargando tus accesos…"
            : roles.length > 0
              ? `Tus roles: ${roles.join(", ")}.`
              : "Aún no tienes roles en esta IPS."
        }
      />

      {access === null ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {roles.length === 0 && (
            <p className="rounded-xl border bg-secondary/40 px-4 py-3 text-sm text-secondary-foreground">
              Pide a un administrador que te asigne tus roles en Administración → Personal para ver pacientes y
              agendas.
            </p>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.href}>
                <Link
                  href={`/dashboard/${teamId}${shortcut.href}`}
                  className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={
                      shortcut.main
                        ? "flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                        : "flex h-10 w-10 items-center justify-center rounded-lg bg-trust/10 text-trust"
                    }
                  >
                    <shortcut.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="mt-4 flex items-center gap-1 font-semibold">
                    {shortcut.title}
                    <ArrowRight
                      className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">{shortcut.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}
