"use client";

import { useParams, useRouter } from "next/navigation";
import { PatientForm } from "@/components/patients/patient-form";
import { useTeamMembers } from "@/components/patients/use-team-members";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerPatient } from "@/lib/api/patients";
import { useApiAuth } from "@/lib/api/use-api-auth";

export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const auth = useApiAuth();
  const members = useTeamMembers();
  const listUrl = `/dashboard/${teamId}/patients`;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-2xl font-bold tracking-tight">Registrar paciente</h2>
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
    </div>
  );
}
