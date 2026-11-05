"use client";

import * as React from "react";
import { BellRing, CheckCircle2, UserX } from "lucide-react";
import { TurnStatusBadge } from "@/components/admission/turn-status-badge";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attendTurn, callTurn, listTurns, markNoShow, Turn } from "@/lib/api/admission";
import { colombiaToday } from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";

const REFRESH_MS = 5_000;

/** Pharmacy's own queue (FAR turns): call the patient to the window, attend, or close as no-show. */
export function PharmacyTurns(props: Readonly<{ teamId: string }>) {
  const { teamId } = props;
  const auth = useApiAuth();
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  /** `keepError`: after an action that failed, reloading must not wipe the message. */
  const load = React.useCallback(async (keepError = false) => {
    try {
      const today = await listTurns(auth, teamId, { date: colombiaToday() });
      setTurns(today.filter((turn) => turn.origin.kind === "farmacia" && (turn.status === "en_espera" || turn.status === "anunciado")));
      if (!keepError) setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [auth, teamId]);

  React.useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (turn: Turn, action: typeof callTurn) => {
    setBusy(turn.id);
    setError("");
    try {
      await action(auth, teamId, turn);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
      await load(true);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Turnos de farmacia <span className="text-muted-foreground">({turns.length} en cola)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p role="alert" className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>}
        {!error && turns.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin turnos en cola. Da turno desde una fórmula para llamar al paciente.</p>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {turns.map((turn) => (
            <div key={turn.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-lg font-bold text-primary">{turn.label}</p>
                  <p className="truncate font-medium">{turn.patient.fullName ?? "Paciente"}</p>
                  <p className="truncate text-xs text-muted-foreground">{turn.location.label} · llegó {turn.appointment.time}</p>
                </div>
                <TurnStatusBadge status={turn.status} calls={turn.calls} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={busy === turn.id} onClick={() => act(turn, callTurn)}>
                  <BellRing className="mr-1.5 h-4 w-4" />
                  {turn.status === "anunciado" ? "Llamar de nuevo" : "Llamar"}
                </Button>
                <Button size="sm" variant="outline" disabled={busy === turn.id} onClick={() => act(turn, attendTurn)}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Atendido
                </Button>
                <Button size="sm" variant="ghost" disabled={busy === turn.id} onClick={() => act(turn, markNoShow)}>
                  <UserX className="mr-1.5 h-4 w-4" /> No se presentó
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
