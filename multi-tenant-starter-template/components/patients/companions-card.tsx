"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenSource } from "@/lib/api/client";
import { Companion, getCompanions, recordCompanion, RELATIONSHIPS } from "@/lib/api/patients";
import { CompanionFields, CompanionState, emptyCompanion, toCompanionInput } from "./companion-fields";
import { errorMessage } from "./error-message";
import { Field, Select } from "./form-controls";
import { memberName, TeamMember } from "./use-team-members";

/** The patient's companions, most recent (#highest) first, and a form to add one. */
export function CompanionsCard(props: {
  auth: TokenSource;
  teamId: string;
  patientId: string;
  members: TeamMember[];
  /** Called after a companion is recorded (e.g. to refresh the timeline). */
  onRecorded?: () => void;
}) {
  const { teamId, patientId } = props;
  const authRef = React.useRef(props.auth);
  authRef.current = props.auth;

  const [history, setHistory] = React.useState<Companion[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<CompanionState>(emptyCompanion);
  const [requestedBy, setRequestedBy] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setHistory((await getCompanions(authRef.current, teamId, patientId)).history);
    } catch {
      setHistory([]);
    }
  }, [teamId, patientId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const recorded = await recordCompanion(authRef.current, teamId, patientId, {
        ...toCompanionInput(form),
        requestedBy: requestedBy || undefined,
      });
      // Show it right away: the list is read from Mongo, which lags the write slightly.
      setHistory((current) => [recorded, ...(current ?? []).filter((c) => c.number !== recorded.number)]);
      setForm(emptyCompanion);
      setRequestedBy("");
      setAdding(false);
      props.onRecorded?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Acompañantes</CardTitle>
          <CardDescription>Quién ha venido con el paciente; el más reciente primero.</CardDescription>
        </div>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <form onSubmit={save} className="space-y-4 rounded-md border p-4">
            <CompanionFields state={form} onChange={setForm} idPrefix="new-companion" />
            <Field label="Solicitado por" id="companion-requestedBy">
              <Select
                id="companion-requestedBy"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
              >
                <option value="">Yo mismo</option>
                {props.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
            {error && (
              <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Guardando…" : "Guardar acompañante"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {history === null ? (
          <Skeleton className="h-16 w-full" />
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin acompañantes registrados.</p>
        ) : (
          <ol className="space-y-3">
            {history.map((companion) => (
              <li key={companion.number} className="flex gap-3 text-sm">
                <span className="w-8 shrink-0 font-mono text-muted-foreground">#{companion.number}</span>
                <div>
                  <p className="font-medium">
                    {companion.fullName ?? "Sin nombre"}
                    {companion.relationship && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {RELATIONSHIPS[companion.relationship] ?? companion.relationship}
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {[
                      companion.document && `${companion.document.type} ${companion.document.number}`,
                      companion.phone,
                      companion.email,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(companion.recordedAt).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · por {memberName(props.members, companion.executedBy)}
                    {companion.requestedBy !== companion.executedBy && (
                      <> · solicitado por {memberName(props.members, companion.requestedBy)}</>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
