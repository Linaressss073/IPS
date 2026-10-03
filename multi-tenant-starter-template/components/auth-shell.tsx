"use client";

import { BadgeCheck } from "lucide-react";
import * as React from "react";
import { ColorModeSwitcher } from "./color-mode-switcher";
import { Logo } from "./logo";

const HIGHLIGHTS = [
  "Un solo registro por paciente en cada IPS",
  "Agendas por profesional y citas trazadas",
  "Roles: cada quien ve solo lo suyo",
];

/**
 * Sign-in, sign-up and the IPS chooser: the brand panel of the landing on
 * the left (wide screens) and the Clerk form on the right.
 */
export function AuthShell(props: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Deep green in dark mode: the bright accent green would glare on a dark screen. */}
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground dark:bg-accent dark:text-accent-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_90%_0%,hsl(var(--trust)/0.45),transparent),radial-gradient(50%_40%_at_0%_100%,hsl(0_0%_100%/0.08),transparent)]"
        />
        <Logo inverse className="relative" />
        <div className="relative space-y-6">
          <p className="text-3xl font-bold leading-tight tracking-tight text-balance">
            Cada paciente, un solo registro y un recorrido sin filas.
          </p>
          <ul className="space-y-2 opacity-90">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-70">Sistema de información hospitalaria · Consulta externa</p>
      </aside>

      <main className="relative isolate flex flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_0%,hsl(var(--primary)/0.10),transparent)]"
        />
        <div className="flex items-center justify-between px-4 py-4 md:px-8">
          <Logo className="lg:invisible" />
          <ColorModeSwitcher />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{props.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
          </div>
          {props.children}
        </div>
      </main>
    </div>
  );
}
