import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{props.title}</legend>
      <div className="grid gap-4 md:grid-cols-2">{props.children}</div>
    </fieldset>
  );
}

export function Field(props: { label: string; id: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1", props.wide && "md:col-span-2")}>
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
    </div>
  );
}

/** Native select styled like the shadcn Input. */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        props.className,
      )}
    />
  );
}
