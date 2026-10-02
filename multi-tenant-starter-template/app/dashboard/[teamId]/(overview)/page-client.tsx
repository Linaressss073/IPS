"use client";

import Link from "next/link";
import { Contact, UserPlus } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Overview of the IPS; it grows as new modules are added. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const patientsUrl = `/dashboard/${teamId}/patients`;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-2xl font-bold tracking-tight">Inicio</h2>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Consulta externa</CardTitle>
          <CardDescription>
            Registra al paciente una sola vez; agendamiento, admisión, consulta y farmacia usarán sus datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`${patientsUrl}/new`}>
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar paciente
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={patientsUrl}>
              <Contact className="mr-2 h-4 w-4" />
              Ver pacientes
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
