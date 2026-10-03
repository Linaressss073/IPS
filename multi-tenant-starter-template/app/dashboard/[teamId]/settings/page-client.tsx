"use client";

import * as React from "react";
import { useOrganization } from "@clerk/nextjs";
import { Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { errorMessage } from "@/components/patients/error-message";
import { Field, Section } from "@/components/patients/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteOrganization,
  getOrganization,
  Organization,
  OrganizationChanges,
  updateOrganization,
} from "@/lib/api/organizations";
import { useApiAuth } from "@/lib/api/use-api-auth";
import { PageHeader, PageShell } from "@/components/page-header";

const FIELDS: { key: keyof OrganizationChanges; label: string; placeholder?: string; wide?: boolean }[] = [
  { key: "name", label: "Nombre de la IPS" },
  { key: "nit", label: "NIT (con dígito de verificación)", placeholder: "900123456-8" },
  { key: "habilitationCode", label: "Código de habilitación (REPS)", placeholder: "110010000001" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Correo institucional" },
  { key: "city", label: "Municipio" },
  { key: "department", label: "Departamento" },
  { key: "address", label: "Dirección", wide: true },
];

/** The IPS's data from the API (MongoDB `organizations`); admins can edit or delete it. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const auth = useApiAuth();
  const { membership } = useOrganization();
  const isAdmin = membership?.role === "org:admin";

  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getOrganization(auth, teamId)
      .then((data) => !cancelled && setOrganization(data))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [auth, teamId]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Administración"
        title="Datos de la IPS"
        description="Identificación de la institución: NIT, código de habilitación y contacto."
        actions={
          organization &&
          isAdmin &&
          !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )
        }
      />

      {error && (
        <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {organization === null ? (
        !error && <Skeleton className="h-48 w-full max-w-3xl" />
      ) : (
        <>
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>{organization.name}</CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Como administrador puedes actualizar estos datos."
                  : "Solo los administradores de la IPS pueden modificar estos datos."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <OrganizationForm
                  organization={organization}
                  onCancel={() => setEditing(false)}
                  onSubmit={async (changes) => {
                    setOrganization(await updateOrganization(auth, teamId, organization.version, changes));
                    setEditing(false);
                  }}
                />
              ) : (
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {FIELDS.filter((f) => f.key !== "name").map((field) => (
                    <div key={field.key}>
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="font-medium">{organization[field.key] ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
            <DangerZone
              organization={organization}
              onDelete={async () => {
                await deleteOrganization(auth, teamId);
                router.replace("/dashboard");
              }}
            />
          )}
        </>
      )}
    </PageShell>
  );
}

function OrganizationForm(props: {
  organization: Organization;
  onSubmit: (changes: OrganizationChanges) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, props.organization[f.key] ?? ""])) as Record<
      keyof OrganizationChanges,
      string
    >,
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Send only what changed; an emptied field is cleared (null).
    const changes: OrganizationChanges = {};
    for (const { key } of FIELDS) {
      const value = values[key].trim();
      if (value !== (props.organization[key] ?? "")) {
        (changes as Record<string, string | null>)[key] = key === "name" ? value : value || null;
      }
    }
    setSaving(true);
    setError(null);
    try {
      await props.onSubmit(changes);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Identificación y contacto">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} id={`org-${field.key}`} wide={field.wide}>
            <Input
              id={`org-${field.key}`}
              placeholder={field.placeholder}
              value={values[field.key]}
              required={field.key === "name"}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            />
          </Field>
        ))}
      </Section>
      {error && (
        <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="ghost" onClick={props.onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/** Deleting asks to type the IPS's name, since it removes everyone's access. */
function DangerZone(props: { organization: Organization; onDelete: () => Promise<void> }) {
  const [confirmation, setConfirmation] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const confirmed = confirmation.trim() === props.organization.name;

  return (
    <Card className="max-w-3xl border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Eliminar IPS</CardTitle>
        <CardDescription>
          Nadie podrá volver a entrar a esta IPS. Los pacientes y su historial se conservan, como exige la ley,
          pero dejarán de ser accesibles desde la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label={`Escribe "${props.organization.name}" para confirmar`} id="delete-confirmation">
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          variant="destructive"
          disabled={!confirmed || deleting}
          onClick={async () => {
            setDeleting(true);
            setError(null);
            try {
              await props.onDelete();
            } catch (err) {
              setError(errorMessage(err));
              setDeleting(false);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? "Eliminando…" : "Eliminar IPS"}
        </Button>
      </CardContent>
    </Card>
  );
}
