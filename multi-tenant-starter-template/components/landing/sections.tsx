import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Contact,
  EyeOff,
  FileClock,
  HeadsetIcon,
  History,
  LockKeyhole,
  MonitorSpeaker,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TurnScreenPreview } from "./turn-screen-preview";

type Icon = LucideIcon;

function SectionHeading(props: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{props.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{props.title}</h2>
      {props.children && <p className="mt-4 text-pretty text-muted-foreground">{props.children}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft green and blue light: calm, clinical, never loud. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_10%,hsl(var(--primary)/0.14),transparent),radial-gradient(50%_45%_at_90%_20%,hsl(var(--trust)/0.12),transparent)]"
      />
      <div className="container grid items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
            Sistema de información hospitalaria · Consulta externa
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Cada paciente, <span className="text-primary">un solo registro</span> y un recorrido sin filas.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Agenda, admite, llama turnos y atiende en un mismo sistema para tu IPS. Cada paso queda trazado: quién lo
            pidió, quién lo hizo y cuándo.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Entrar al sistema <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/#modulos" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Ver módulos
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
            {["Roles por IPS", "Trazabilidad completa", "Modo claro y oscuro"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <TurnScreenPreview />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const STATS = [
  { value: "1", label: "registro por paciente en cada IPS" },
  { value: "6", label: "roles con permisos distintos" },
  { value: "100 %", label: "de los cambios con trazabilidad" },
  { value: "UTC−5", label: "agendas en hora de Colombia" },
];

export function Stats() {
  return (
    <section aria-label="En cifras" className="border-y bg-muted/30">
      <dl className="container grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:px-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <dt className="sr-only">{stat.label}</dt>
            <dd className="text-3xl font-bold tracking-tight text-primary">{stat.value}</dd>
            <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------

const MODULES: { icon: Icon; title: string; description: string; ready: boolean }[] = [
  {
    icon: Contact,
    title: "Pacientes",
    description: "Registro único con documento colombiano, afiliación, acompañantes numerados e historial.",
    ready: true,
  },
  {
    icon: CalendarDays,
    title: "Agendamiento",
    description: "Agendas por profesional divididas en cupos; agendar, confirmar, reprogramar y cancelar.",
    ready: true,
  },
  {
    icon: MonitorSpeaker,
    title: "Admisión y turnos",
    description: "Llegada a sala, turno por servicio (RTH 4) y pantalla de llamado con reanuncio automático.",
    ready: false,
  },
  {
    icon: Stethoscope,
    title: "Consulta médica",
    description: "El profesional llama al paciente, registra la atención y deja las órdenes.",
    ready: false,
  },
  {
    icon: Pill,
    title: "Farmacia",
    description: "Dispensación de lo formulado en la consulta, con su propio llamado de turno.",
    ready: false,
  },
  {
    icon: UserCog,
    title: "Usuarios y roles",
    description: "Personal de cada IPS con roles: agendamiento, admisión, médico, farmacia y soporte.",
    ready: true,
  },
  {
    icon: History,
    title: "Trazabilidad",
    description: "Historial del paciente con cada paso: quién lo pidió, quién lo hizo y cuándo.",
    ready: true,
  },
  {
    icon: HeadsetIcon,
    title: "Mesa de ayuda",
    description: "Solicitudes del personal al equipo de soporte, con seguimiento.",
    ready: false,
  },
];

export function Modules() {
  return (
    <section id="modulos" className="scroll-mt-20 py-20">
      <div className="container px-4 md:px-8">
        <SectionHeading eyebrow="Módulos" title="Todo lo que pasa en la consulta externa">
          Lo que ya está en funcionamiento y lo que viene, sobre la misma base de datos de pacientes.
        </SectionHeading>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => (
            <li
              key={module.title}
              className="group flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    module.ready ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <module.icon className="h-5 w-5" aria-hidden />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    module.ready
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {module.ready ? "Disponible" : "Próximamente"}
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{module.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const JOURNEY: { icon: Icon; title: string; description: string }[] = [
  { icon: Contact, title: "Registro", description: "Se le piden sus datos una sola vez." },
  { icon: CalendarDays, title: "Cita", description: "Se agenda en un cupo libre y se confirma." },
  { icon: ClipboardCheck, title: "Admisión", description: "Llega, se verifica y recibe su turno." },
  { icon: MonitorSpeaker, title: "Llamado", description: "La pantalla lo llama al consultorio." },
  { icon: Stethoscope, title: "Consulta", description: "El profesional lo atiende y formula." },
  { icon: Pill, title: "Farmacia", description: "Recibe lo formulado y termina su recorrido." },
];

export function Journey() {
  return (
    <section id="recorrido" className="scroll-mt-20 border-y bg-muted/30 py-20">
      <div className="container px-4 md:px-8">
        <SectionHeading eyebrow="Recorrido del paciente" title="De la cita a la farmacia, sin repetir datos">
          Cada área usa el mismo registro y deja su paso en el historial del paciente.
        </SectionHeading>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {JOURNEY.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
              {/* Connector between steps on wide screens. */}
              {index < JOURNEY.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-4rem)] bg-border lg:block"
                />
              )}
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-primary">
                <step.icon className="h-5 w-5" aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const ROLES: { role: string; can: string }[] = [
  { role: "Administrador", can: "Configura la IPS, sus servicios y consultorios, y asigna roles al personal." },
  { role: "Agendamiento", can: "Registra pacientes y gestiona agendas y citas." },
  { role: "Admisión", can: "Registra la llegada, admite y llama turnos." },
  { role: "Médico", can: "Ve su agenda y a sus pacientes, y llama a consulta." },
  { role: "Farmacia", can: "Consulta pacientes y llama turnos de dispensación." },
  { role: "Soporte", can: "Atiende la mesa de ayuda sin acceso a datos clínicos." },
];

export function Roles() {
  return (
    <section id="roles" className="scroll-mt-20 py-20">
      <div className="container grid gap-10 px-4 md:px-8 lg:grid-cols-[2fr_3fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Roles</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Cada quien ve y hace solo lo que le corresponde
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Los permisos se revisan en cada petición. Una persona puede tener varios roles, y en cada IPS los suyos.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((item) => (
            <li key={item.role} className="rounded-xl border bg-card p-4">
              <p className="font-semibold">{item.role}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.can}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const SAFEGUARDS: { icon: Icon; title: string; description: string }[] = [
  {
    icon: Building2,
    title: "Datos aislados por IPS",
    description: "Cada institución ve solo a sus pacientes, su personal y sus agendas.",
  },
  {
    icon: EyeOff,
    title: "Datos mínimos del personal",
    description: "Solo nombre y correo enmascarado (and****@cli***.c**); nunca el correo completo.",
  },
  {
    icon: FileClock,
    title: "Trazabilidad que no se borra",
    description: "Cada cambio guarda quién lo pidió y quién lo ejecutó; el historial solo crece.",
  },
  {
    icon: LockKeyhole,
    title: "Derecho al olvido",
    description: "Quien deja el sistema queda anonimizado (Ley 1581 de 2012) sin romper el historial.",
  },
];

export function Security() {
  return (
    <section id="seguridad" className="scroll-mt-20 border-y bg-secondary/40 py-20">
      <div className="container px-4 md:px-8">
        <SectionHeading eyebrow="Seguridad y privacidad" title="Confianza en cada dato">
          Pensado para la información de salud: acceso por roles, datos mínimos y un registro de todo lo que pasa.
        </SectionHeading>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAFEGUARDS.map((item) => (
            <li key={item.title} className="rounded-xl border bg-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-trust/10 text-trust">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function CallToAction() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_85%_0%,hsl(var(--trust)/0.45),transparent)]"
          />
          <div className="relative mx-auto max-w-2xl space-y-4">
            <ShieldCheck className="mx-auto h-10 w-10 opacity-90" aria-hidden />
            <h2 className="text-3xl font-bold tracking-tight text-balance">Lleva tu consulta externa a un solo lugar</h2>
            <p className="text-pretty opacity-90">
              Crea la cuenta de tu IPS, invita a tu equipo y asigna los roles. Tus pacientes se registran una sola vez.
            </p>
            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "gap-2")}
              >
                Crear cuenta <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
