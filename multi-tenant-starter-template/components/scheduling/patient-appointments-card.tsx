"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenSource } from "@/lib/api/client";
import { Appointment, APPOINTMENT_STATUSES, formatDay, searchAppointments } from "@/lib/api/scheduling";

/** The patient's appointments, upcoming first; a shortcut to book a new one. */
export function PatientAppointmentsCard(props: {
  auth: TokenSource;
  teamId: string;
  patientId: string;
  canBook: boolean;
}) {
  const { auth, teamId, patientId } = props;
  const [appointments, setAppointments] = React.useState<Appointment[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    searchAppointments(auth, teamId, { patientId })
      .then((list) => !cancelled && setAppointments(list))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [auth, teamId, patientId]);

  const now = Date.now();
  const upcoming = (appointments ?? []).filter((a) => a.status !== "cancelada" && Date.parse(a.startsAt) > now);
  const others = (appointments ?? []).filter((a) => !upcoming.includes(a)).reverse();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Citas</CardTitle>
          <CardDescription>Próximas y anteriores.</CardDescription>
        </div>
        {props.canBook && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/${teamId}/agenda?patientId=${patientId}`}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Agendar
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {appointments === null ? (
          !error && <Skeleton className="h-16 w-full" />
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin citas.</p>
        ) : (
          <ul className="divide-y text-sm">
            {[...upcoming, ...others].map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">
                    <span className="capitalize">{formatDay(a.date)}</span>, {a.time}
                  </p>
                  <p className="text-muted-foreground">
                    {a.service.code} · {a.service.name} · {a.location.label} ·{" "}
                    {a.professional.displayName ?? a.professional.userId}
                  </p>
                </div>
                <span className="whitespace-nowrap rounded border px-1.5 py-0.5 text-xs">
                  {APPOINTMENT_STATUSES[a.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
