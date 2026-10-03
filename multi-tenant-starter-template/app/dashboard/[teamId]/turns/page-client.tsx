"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BellRing, CheckCircle2, MonitorPlay, UserX } from "lucide-react";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { TurnStatusBadge } from "@/components/admission/turn-status-badge";
import { PageHeader, PageShell } from "@/components/page-header";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { attendTurn, callTurn, listTurns, markNoShow, Turn, TurnStatus } from "@/lib/api/admission";
import { colombiaToday } from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";

const REFRESH_MS = 5_000;

const GROUPS: { title: string; statuses: TurnStatus[] }[] = [
  { title: "Anunciados", statuses: ["anunciado"] },
  { title: "En espera", statuses: ["en_espera"] },
  { title: "Cerrados", statuses: ["atendido", "no_se_presento"] },
];

/** Turnos: today's queue; call, call again, attend or close as a no-show. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const allowed = can("turns:call") || can("admission:manage");
  const canCall = can("turns:call");
  // Professionals see their own patients first; admission sees everyone.
  const [mine, setMine] = React.useState(false);
  React.useEffect(() => {
    if (access) setMine(access.roles.includes("medico") && !access.roles.includes("admision"));
  }, [access]);

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setTurns(
        await listTurns(auth, teamId, {
          date: colombiaToday(),
          professionalId: mine && access ? access.userId : undefined,
        }),
      );
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoaded(true);
    }
  }, [auth, teamId, mine, access]);

  React.useEffect(() => {
    if (!allowed) return;
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [allowed, load]);

  if (access && !allowed) return <NoPermission what="ver los turnos" />;

  const act = async (turn: Turn, action: typeof callTurn) => {
    setBusy(turn.id);
    try {
      await action(auth, teamId, turn);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
      await load();
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admisión y turnos"
        title="Turnos de hoy"
        description="Llama al siguiente paciente: aparece en la pantalla de sala y se repite solo hasta que lo recibas."
        actions={
          <>
            <Button variant={mine ? "default" : "outline"} onClick={() => setMine((value) => !value)}>
              {mine ? "Solo mis pacientes" : "Todos los pacientes"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/${teamId}/turns/screen`}>
                <MonitorPlay className="mr-2 h-4 w-4" /> Pantalla de sala
              </Link>
            </Button>
          </>
        }
      />
      {error && <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>}

      {!loaded ? (
        <Skeleton className="h-40 w-full" />
      ) : turns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay turnos hoy. Se crean cuando Admisión registra la llegada del paciente.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {GROUPS.map((group) => {
            const items = turns.filter((turn) => group.statuses.includes(turn.status));
            return (
              <Card key={group.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {group.title} <span className="text-muted-foreground">({items.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.length === 0 && <p className="text-sm text-muted-foreground">Ninguno.</p>}
                  {items.map((turn) => (
                    <div key={turn.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-lg font-bold text-primary">{turn.label}</p>
                          <p className="truncate font-medium">{turn.patient.fullName ?? "Paciente"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            Cita {turn.appointment.time} · {turn.location.label} ·{" "}
                            {turn.professional.displayName ?? turn.professional.userId}
                          </p>
                        </div>
                        <TurnStatusBadge status={turn.status} calls={turn.calls} />
                      </div>
                      {canCall && (turn.status === "en_espera" || turn.status === "anunciado") && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" disabled={busy === turn.id} onClick={() => act(turn, callTurn)}>
                            <BellRing className="mr-1.5 h-4 w-4" />
                            {turn.status === "anunciado" ? "Llamar de nuevo" : "Llamar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === turn.id}
                            onClick={() => act(turn, attendTurn)}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Atendido
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === turn.id}
                            onClick={() => act(turn, markNoShow)}
                          >
                            <UserX className="mr-1.5 h-4 w-4" /> No se presentó
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
