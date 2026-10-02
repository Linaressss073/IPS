"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { assignRoles, listStaff, ROLE_LABELS, StaffMember } from "@/lib/api/staff";
import { useApiAuth } from "@/lib/api/use-api-auth";

/** Administración → Personal: who works at the IPS and their roles (admins only). */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useApiAuth();
  const { access, can, reload } = useAccess();
  const [staff, setStaff] = React.useState<StaffMember[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    listStaff(auth, teamId)
      .then((data) => !cancelled && setStaff(data))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [auth, teamId]);

  if (access && !can("staff:manage")) return <NoPermission what="gestionar el personal" />;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-2xl font-bold tracking-tight">Personal</h2>
      <Card>
        <CardHeader>
          <CardTitle>Roles en la IPS</CardTitle>
          <CardDescription>
            Cada rol habilita acciones: agendamiento agenda citas, admisión admite y llama turnos, médico y
            farmacia consultan pacientes y llaman turnos. Los administradores se definen en Clerk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          {staff === null ? (
            !error && <Skeleton className="h-24 w-full" />
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay personal sincronizado. Aparece cuando Clerk envía los cambios (webhooks) o al correr
              <code className="mx-1">pnpm clerk:sync</code>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Persona</th>
                    <th className="py-2 pr-4 font-medium">Roles</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <StaffRow
                      key={member.userId}
                      member={member}
                      isMe={member.userId === access?.userId}
                      onSave={async (roles) => {
                        const saved = await assignRoles(auth, teamId, member.userId, roles);
                        setStaff((current) =>
                          (current ?? []).map((m) => (m.userId === saved.userId ? saved : m)),
                        );
                        if (member.userId === access?.userId) reload();
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StaffRow(props: {
  member: StaffMember;
  isMe: boolean;
  onSave: (roles: string[]) => Promise<void>;
}) {
  const { member } = props;
  const [roles, setRoles] = React.useState<string[]>(member.roles);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const changed =
    roles.length !== member.roles.length || roles.some((role) => !member.roles.includes(role));

  const toggle = (role: string) =>
    setRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    );

  return (
    <tr className="border-b align-top last:border-0">
      <td className="py-3 pr-4">
        <p className="font-medium">
          {member.displayName ?? "Sin nombre"}
          {props.isMe && <span className="text-muted-foreground"> (tú)</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {member.emailMasked ?? "—"}
          {member.providerRole === "org:admin" && " · Administrador"}
        </p>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <label key={role} className="flex items-center gap-1.5">
              <input type="checkbox" checked={roles.includes(role)} onChange={() => toggle(role)} />
              {label}
            </label>
          ))}
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </td>
      <td className="whitespace-nowrap py-3 text-right">
        <Button
          size="sm"
          disabled={!changed || saving}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await props.onSave(roles);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </td>
    </tr>
  );
}
