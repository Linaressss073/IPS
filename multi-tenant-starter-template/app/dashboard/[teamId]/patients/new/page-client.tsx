"use client";

import { useParams, useRouter } from "next/navigation";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { PatientForm } from "@/components/patients/patient-form";
import { useTeamMembers } from "@/components/patients/use-team-members";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerPatient } from "@/lib/api/patients";
import { useApiAuth } from "@/lib/api/use-api-auth";
import { PageHeader, PageShell } from "@/components/page-header";

export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const auth = useApiAuth();
  const members = useTeamMembers();
  const listUrl = `/dashboard/${teamId}/patients`;
  const { access, can } = useAccess();

  if (access && !can("patients:write")) return <NoPermission what="registrar pacientes" />;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Pacientes"
        title="Registrar paciente"
        description="Sus datos quedan disponibles para agendamiento, admisión, consulta y farmacia."
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Datos del paciente</CardTitle>
          <CardDescription>
            Se registra una sola vez: agendamiento, admisión, consulta y farmacia usarán estos datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm
            withCompanion
            members={members}
            submitLabel="Registrar"
            onCancel={() => router.push(listUrl)}
            onSubmit={async (input) => {
              const patient = await registerPatient(auth, teamId, input);
              router.push(`${listUrl}/${patient.id}`);
            }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
