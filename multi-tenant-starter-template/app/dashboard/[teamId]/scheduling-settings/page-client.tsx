"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { errorMessage } from "@/components/patients/error-message";
import { Field } from "@/components/patients/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createLocation,
  createService,
  listLocations,
  listServices,
  Location,
  Service,
  setLocationActive,
  updateService,
} from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";
import { PageHeader, PageShell } from "@/components/page-header";

/** Administración → Servicios y consultorios: what agendas are built from. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const [services, setServices] = React.useState<Service[] | null>(null);
  const [locations, setLocations] = React.useState<Location[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([listServices(auth, teamId), listLocations(auth, teamId)])
      .then(([s, l]) => {
        if (cancelled) return;
        setServices(s);
        setLocations(l);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [auth, teamId]);

  if (access && !can("settings:manage")) {
    return <NoPermission what="configurar servicios y consultorios" />;
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Administración"
        title="Servicios y consultorios"
        description="Lo que necesitan las agendas: servicios con su prefijo de turno y los lugares de atención."
      />
      {error && (
        <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Servicios</CardTitle>
            <CardDescription>
              El prefijo identifica los turnos del servicio en la pantalla de llamado (p. ej. RTH 4).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddForm
              fields={[
                { key: "code", label: "Prefijo", placeholder: "RTH", maxLength: 4 },
                { key: "name", label: "Nombre", placeholder: "Rehabilitación" },
              ]}
              submitLabel="Agregar servicio"
              onSubmit={async (v) => {
                const created = await createService(auth, teamId, { code: v.code, name: v.name });
                setServices((current) => sortBy([...(current ?? []), created], (s) => s.name));
              }}
            />
            <ItemList
              items={services}
              empty="Aún no hay servicios."
              render={(s) => (
                <>
                  <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{s.code}</span>
                  {s.name}
                </>
              )}
              onToggle={async (s) => {
                const saved = await updateService(auth, teamId, s.id, { active: !s.active });
                setServices((current) => (current ?? []).map((x) => (x.id === saved.id ? saved : x)));
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consultorios y módulos</CardTitle>
            <CardDescription>Dónde se atiende y se llama al paciente: “Consultorio 502”, “Vacunación 101”.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddForm
              fields={[
                { key: "kind", label: "Tipo", placeholder: "Consultorio" },
                { key: "number", label: "Número", placeholder: "502", maxLength: 10 },
              ]}
              submitLabel="Agregar ubicación"
              onSubmit={async (v) => {
                const created = await createLocation(auth, teamId, { kind: v.kind, number: v.number });
                setLocations((current) => sortBy([...(current ?? []), created], (l) => l.label));
              }}
            />
            <ItemList
              items={locations}
              empty="Aún no hay ubicaciones."
              render={(l) => l.label}
              onToggle={async (l) => {
                const saved = await setLocationActive(auth, teamId, l.id, !l.active);
                setLocations((current) => (current ?? []).map((x) => (x.id === saved.id ? saved : x)));
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function AddForm(props: {
  fields: { key: string; label: string; placeholder: string; maxLength?: number }[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const empty = Object.fromEntries(props.fields.map((f) => [f.key, ""]));
  const [values, setValues] = React.useState<Record<string, string>>(empty);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
          await props.onSubmit(values);
          setValues(empty);
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        {props.fields.map((f) => (
          <Field key={f.key} label={f.label} id={`add-${f.key}`}>
            <Input
              id={`add-${f.key}`}
              placeholder={f.placeholder}
              maxLength={f.maxLength}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              required
            />
          </Field>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Guardando…" : props.submitLabel}
      </Button>
    </form>
  );
}

function ItemList<T extends { id: string; active: boolean }>(props: {
  items: T[] | null;
  empty: string;
  render: (item: T) => React.ReactNode;
  onToggle: (item: T) => Promise<void>;
}) {
  const [error, setError] = React.useState<string | null>(null);
  if (props.items === null) return <Skeleton className="h-16 w-full" />;
  if (props.items.length === 0) return <p className="text-sm text-muted-foreground">{props.empty}</p>;
  return (
    <div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <ul className="divide-y rounded-md border">
        {props.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className={item.active ? "" : "text-muted-foreground line-through"}>{props.render(item)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => props.onToggle(item).catch((e) => setError(errorMessage(e)))}
            >
              {item.active ? "Desactivar" : "Activar"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function sortBy<T>(items: T[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => key(a).localeCompare(key(b), "es"));
}
