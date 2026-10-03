"use client";

import * as React from "react";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Consultation, ROUTES, VITAL_SIGNS } from "@/lib/api/consultation";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{props.title}</h3>
      <div className="whitespace-pre-wrap text-sm">{props.children}</div>
    </section>
  );
}

/** A signed consultation, read-only; its physician may append addenda. */
export function ConsultationRecord(props: {
  consultation: Consultation;
  canAmend: boolean;
  onAddendum: (text: string) => Promise<void>;
}) {
  const { consultation: c } = props;
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <Section title="Motivo de consulta">{c.note.reason || "—"}</Section>
          <Section title="Enfermedad actual">{c.note.currentIllness || "—"}</Section>
          {c.vitals.length > 0 && (
            <Section title="Signos vitales">
              <ul className="flex flex-wrap gap-x-6 gap-y-1">
                {c.vitals.map((v) => (
                  <li key={v.name}>
                    {VITAL_SIGNS[v.name].label}: <strong>{v.value}</strong> {v.unit}
                  </li>
                ))}
                {c.bmi.map((bmi) => (
                  <li key="bmi">
                    IMC: <strong>{bmi}</strong>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section title="Examen físico">{c.note.physicalExam || "—"}</Section>
          <Section title="Diagnósticos">
            <ul>
              {c.diagnoses.map((d) => (
                <li key={d.code}>
                  <span className="font-mono font-semibold">{d.code}</span> {d.description}
                  {d.principal && <span className="text-muted-foreground"> (principal)</span>}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Plan y conducta">{c.note.plan || "—"}</Section>
          {c.prescription.length > 0 && (
            <Section title="Fórmula médica">
              <ol className="list-decimal space-y-1 pl-5">
                {c.prescription.map((item, index) => (
                  <li key={index}>
                    <strong>{item.medication}</strong> ({item.presentation}) · {item.dose} {ROUTES[item.route]?.toLowerCase()}{" "}
                    {item.frequency.toLowerCase()} por {item.durationDays} días · cantidad {item.quantity}
                    {item.instructions && ` · ${item.instructions}`}
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas aclaratorias</CardTitle>
          <CardDescription>La consulta firmada no se modifica: las correcciones y hallazgos posteriores se agregan aquí.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {c.addenda.length === 0 && <p className="text-sm text-muted-foreground">Sin notas.</p>}
          {c.addenda.map((a, index) => (
            <div key={index} className="rounded-md border-l-4 border-trust/50 bg-muted/40 px-3 py-2 text-sm">
              <p className="whitespace-pre-wrap">{a.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(a.writtenAt)} · {a.writtenByName || a.writtenBy}
              </p>
            </div>
          ))}
          {props.canAmend && (
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await props.onAddendum(text);
                  setText("");
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Nota aclaratoria"
                maxLength={4000}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={busy || !text.trim()}>
                Agregar nota
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
