"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LogIn, RefreshCw } from "lucide-react";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { PageHeader, PageShell } from "@/components/page-header";
import { errorMessage } from "@/components/patients/error-message";
import { TurnStatusBadge } from "@/components/admission/turn-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { checkIn, listTurns, Turn } from "@/lib/api/admission";
import { Appointment, APPOINTMENT_STATUSES, colombiaToday, searchAppointments } from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";

const REFRESH_MS = 10_000;

/** Admisión: today's appointments; registering the arrival gives the turn. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const allowed = can("admission:manage");
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [filter, setFilter] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const today = colombiaToday();
      const [a, t] = await Promise.all([
        searchAppointments(auth, teamId, { date: today }),
        listTurns(auth, teamId, { date: today }),
      ]);
      setAppointments(a.filter((appointment) => appointment.status !== "cancelada"));
      setTurns(t);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoaded(true);
    }
  }, [auth, teamId]);

  React.useEffect(() => {
    if (!allowed) return;
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [allowed, load]);

  if (access && !allowed) return <NoPermission what="registrar la llegada de pacientes" />;

  const turnOf = new Map(turns.map((turn) => [turn.appointment.id, turn]));
  const words = filter.toLowerCase().split(" ").filter(Boolean);
  const visible = appointments.filter((a) => {
    const text = `${a.patient.fullName ?? ""} ${a.patient.document?.number ?? ""} ${a.service.code}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
  const waiting = turns.filter((turn) => turn.status === "en_espera").length;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admisión"
        title="Llegadas de hoy"
        description={`Registra la llegada del paciente: recibe su turno y espera el llamado. ${waiting} en espera.`}
        actions={
          <>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/${teamId}/turns`}>Ver turnos</Link>
            </Button>
          </>
        }
      />

      <Input
        className="max-w-sm"
        placeholder="Buscar por nombre, documento o servicio"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {error && <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>}

      {!loaded ? (
        <Skeleton className="h-40 w-full" />
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay citas para hoy{filter && " con ese dato"}.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {visible.map((a) => {
                const turn = turnOf.get(a.id);
                return (
                  <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="w-12 shrink-0 font-semibold tabular-nums">{a.time}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.patient.fullName ?? "Paciente"}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {a.patient.document && `${a.patient.document.type} ${a.patient.document.number} · `}
                          {a.service.code} {a.service.name} · {a.location.label} ·{" "}
                          {a.professional.displayName ?? a.professional.userId}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                      {turn ? (
                        <>
                          <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold text-primary">
                            {turn.label}
                          </span>
                          <TurnStatusBadge status={turn.status} />
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">{APPOINTMENT_STATUSES[a.status]}</span>
                          <Button
                            size="sm"
                            disabled={busy === a.id}
                            onClick={async () => {
                              setBusy(a.id);
                              try {
                                await checkIn(auth, teamId, a.id);
                                await load();
                              } catch (e) {
                                setError(errorMessage(e));
                              } finally {
                                setBusy("");
                              }
                            }}
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            Registrar llegada
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
