import * as React from "react";
import { cn } from "@/lib/utils";

/** Content area of a dashboard page: same gutters on every screen size. */
export function PageShell(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 md:px-8 md:py-8", props.className)}>
      {props.children}
    </div>
  );
}

/**
 * Title of a dashboard page in the landing's style: a green eyebrow (the
 * area), the title and an optional description, with actions on the right.
 */
export function PageHeader(props: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{props.eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{props.title}</h1>
        {props.description && <p className="text-pretty text-sm text-muted-foreground">{props.description}</p>}
      </div>
      {props.actions && <div className="flex shrink-0 flex-wrap gap-2">{props.actions}</div>}
    </div>
  );
}
