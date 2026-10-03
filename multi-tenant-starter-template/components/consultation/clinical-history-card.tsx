"use client";

import * as React from "react";
import Link from "next/link";
import { errorMessage } from "@/components/patients/error-message";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenSource } from "@/lib/api/client";
import { Consultation, listPatientConsultations } from "@/lib/api/consultation";
import { formatDay } from "@/lib/api/scheduling";

/** The patient's consultations (physicians only), newest first. */
export function ClinicalHistoryCard(props: { auth: TokenSource; teamId: string; patientId: string }) {
  const { auth, teamId, patientId } = props;
  const [state, setState] = React.useState<{ loading: true } | { loading: false; items: Consultation[] }>({
    loading: true,
  });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    listPatientConsultations(auth, teamId, patientId)
      .then((items) => setState({ loading: false, items }))
      .catch((e) => setError(errorMessage(e)));
  }, [auth, teamId, patientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia clínica</CardTitle>
        <CardDescription>Solo la ven los médicos de la IPS.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {state.loading ? (
          !error && <Skeleton className="h-16 w-full" />
        ) : state.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin consultas.</p>
        ) : (
          <ul className="divide-y text-sm">
            {state.items.map((c) => {
              const principal = c.diagnoses.find((d) => d.principal);
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/${teamId}/consultations/${c.id}`}
                    className="flex items-start justify-between gap-2 py-2 hover:underline"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        <span className="capitalize">{formatDay(c.appointment.date)}</span> · {c.service.code}{" "}
                        {c.service.name}
                      </p>
                      <p className="truncate text-muted-foreground">
                        {principal ? `${principal.code} ${principal.description}` : "Sin diagnóstico"} ·{" "}
                        {c.physician.displayName || c.physician.userId}
                      </p>
                    </div>
                    <span
                      className={
                        c.status === "firmada"
                          ? "shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                          : "shrink-0 rounded-full bg-trust/10 px-2 py-0.5 text-xs text-trust"
                      }
                    >
                      {c.status === "firmada" ? "Firmada" : "En curso"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
