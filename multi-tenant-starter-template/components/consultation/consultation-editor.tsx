"use client";

import * as React from "react";
import { Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { errorMessage } from "@/components/patients/error-message";
import { Field, Select } from "@/components/patients/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Consultation,
  Diagnosis,
  Note,
  PrescriptionItem,
  ROUTES,
  VITAL_SIGNS,
  VitalSign,
  VitalSignName,
} from "@/lib/api/consultation";
import { CIE10_PATTERN, searchCie10 } from "@/lib/cie10";
import { cn } from "@/lib/utils";

type Draft = { note: Note; vitals: VitalSign[]; diagnoses: Diagnosis[]; prescription: PrescriptionItem[] };

const EMPTY_ITEM: PrescriptionItem = {
  medication: "",
  presentation: "",
  dose: "",
  route: "oral",
  frequency: "",
  durationDays: 5,
  quantity: 1,
  instructions: "",
};

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        props.className,
      )}
    />
  );
}

/** The draft of a consultation: save as often as needed, then sign. */
export function ConsultationEditor(props: {
  consultation: Consultation;
  onSave: (draft: Draft) => Promise<void>;
  onSign: (draft: Draft) => Promise<void>;
}) {
  const { consultation } = props;
  const [note, setNote] = React.useState<Note>(consultation.note);
  // Vital signs as editable text per sign; empty means "not measured".
  const [vitals, setVitals] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(consultation.vitals.map((v) => [v.name, String(v.value)])),
  );
  const [diagnoses, setDiagnoses] = React.useState<Diagnosis[]>(consultation.diagnoses);
  const [prescription, setPrescription] = React.useState<PrescriptionItem[]>(consultation.prescription);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState("");
  const [confirmSign, setConfirmSign] = React.useState(false);

  const draft = (): Draft => ({
    note,
    vitals: Object.entries(vitals)
      .filter(([, value]) => value.trim() !== "")
      .map(([name, value]) => ({ name: name as VitalSignName, value: Number(value) })),
    diagnoses,
    prescription,
  });

  const run = async (kind: "save" | "sign") => {
    setBusy(kind);
    setError("");
    setSaved("");
    try {
      if (kind === "save") {
        await props.onSave(draft());
        setSaved(`Borrador guardado a las ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}.`);
      } else {
        await props.onSign(draft());
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
      setConfirmSign(false);
    }
  };

  const setNoteField = (key: keyof Note) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setNote((n) => ({ ...n, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Anamnesis</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Motivo de consulta *" id="reason" wide>
            <Input id="reason" maxLength={1000} value={note.reason} onChange={setNoteField("reason")} />
          </Field>
          <Field label="Enfermedad actual" id="illness" wide>
            <TextArea id="illness" maxLength={4000} value={note.currentIllness} onChange={setNoteField("currentIllness")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signos vitales y examen físico</CardTitle>
          <CardDescription>Solo lo que midas; el IMC se calcula con peso y talla.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(Object.keys(VITAL_SIGNS) as VitalSignName[]).map((name) => {
              const rule = VITAL_SIGNS[name];
              const value = vitals[name] ?? "";
              const outOfRange = value !== "" && (Number(value) < rule.min || Number(value) > rule.max);
              return (
                <Field key={name} label={`${rule.label} (${rule.unit})`} id={`vital-${name}`}>
                  <Input
                    id={`vital-${name}`}
                    type="number"
                    inputMode="decimal"
                    min={rule.min}
                    max={rule.max}
                    step={rule.step}
                    value={value}
                    aria-invalid={outOfRange}
                    className={outOfRange ? "border-destructive" : ""}
                    onChange={(e) => setVitals((v) => ({ ...v, [name]: e.target.value }))}
                  />
                </Field>
              );
            })}
          </div>
          <Field label="Examen físico" id="exam" wide>
            <TextArea id="exam" maxLength={4000} value={note.physicalExam} onChange={setNoteField("physicalExam")} />
          </Field>
        </CardContent>
      </Card>

      <DiagnosesCard diagnoses={diagnoses} onChange={setDiagnoses} />

      <Card>
        <CardHeader>
          <CardTitle>Plan y conducta</CardTitle>
        </CardHeader>
        <CardContent>
          <TextArea id="plan" maxLength={4000} value={note.plan} onChange={setNoteField("plan")} />
        </CardContent>
      </Card>

      <PrescriptionCard items={prescription} onChange={setPrescription} />

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:-mx-8 md:px-8">
        <div className="text-sm">
          {error && <p className="text-destructive">{error}</p>}
          {saved && !error && <p className="text-muted-foreground">{saved}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy !== ""} onClick={() => run("save")}>
            <Save className="mr-2 h-4 w-4" /> {busy === "save" ? "Guardando…" : "Guardar borrador"}
          </Button>
          {confirmSign ? (
            <>
              <Button disabled={busy !== ""} onClick={() => run("sign")}>
                <ShieldCheck className="mr-2 h-4 w-4" /> {busy === "sign" ? "Firmando…" : "Sí, firmar"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmSign(false)}>
                Volver
              </Button>
            </>
          ) : (
            <Button disabled={busy !== ""} onClick={() => setConfirmSign(true)}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Firmar consulta
            </Button>
          )}
        </div>
      </div>
      {confirmSign && (
        <p className="text-right text-sm text-muted-foreground">
          Al firmar, la consulta ya no se puede modificar; solo agregar notas aclaratorias.
        </p>
      )}
    </div>
  );
}

function DiagnosesCard(props: { diagnoses: Diagnosis[]; onChange: (d: Diagnosis[]) => void }) {
  const { diagnoses, onChange } = props;
  const [query, setQuery] = React.useState("");
  const [custom, setCustom] = React.useState({ code: "", description: "" });
  const matches = searchCie10(query).filter((m) => !diagnoses.some((d) => d.code === m.code));

  const add = (code: string, description: string) => {
    onChange([...diagnoses, { code, description, principal: diagnoses.length === 0 }]);
    setQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnósticos (CIE-10)</CardTitle>
        <CardDescription>El primero queda como principal; puedes cambiarlo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnoses.length > 0 && (
          <ul className="divide-y rounded-md border">
            {diagnoses.map((d) => (
              <li key={d.code} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <label className="flex min-w-0 items-center gap-2">
                  <input
                    type="radio"
                    name="principal"
                    checked={d.principal}
                    onChange={() => onChange(diagnoses.map((x) => ({ ...x, principal: x.code === d.code })))}
                  />
                  <span className="font-mono font-semibold">{d.code}</span>
                  <span className="truncate">{d.description}</span>
                  {d.principal && (
                    <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                      Principal
                    </span>
                  )}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${d.code}`}
                  onClick={() => {
                    const rest = diagnoses.filter((x) => x.code !== d.code);
                    // Keep one principal if the principal was removed.
                    if (d.principal && rest.length > 0) rest[0] = { ...rest[0], principal: true };
                    onChange(rest);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2">
          <Input placeholder="Buscar por código o nombre (p. ej. J06 o faringitis)" value={query} onChange={(e) => setQuery(e.target.value)} />
          {matches.length > 0 && (
            <ul className="divide-y rounded-md border">
              {matches.map((m) => (
                <li key={m.code}>
                  <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => add(m.code, m.description)}>
                    <span className="font-mono font-semibold">{m.code}</span> · {m.description}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Otro código CIE-10</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
            <Input placeholder="Código" value={custom.code} onChange={(e) => setCustom((c) => ({ ...c, code: e.target.value.toUpperCase() }))} />
            <Input placeholder="Descripción" value={custom.description} onChange={(e) => setCustom((c) => ({ ...c, description: e.target.value }))} />
            <Button
              type="button"
              variant="outline"
              disabled={!CIE10_PATTERN.test(custom.code) || !custom.description.trim() || diagnoses.some((d) => d.code === custom.code)}
              onClick={() => {
                add(custom.code, custom.description.trim());
                setCustom({ code: "", description: "" });
              }}
            >
              Agregar
            </Button>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function PrescriptionCard(props: { items: PrescriptionItem[]; onChange: (items: PrescriptionItem[]) => void }) {
  const { items, onChange } = props;
  const update = (index: number, changes: Partial<PrescriptionItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Fórmula médica</CardTitle>
          <CardDescription>Lo que farmacia dispensará.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => onChange([...items, { ...EMPTY_ITEM }])}>
          <Plus className="mr-1.5 h-4 w-4" /> Medicamento
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Sin medicamentos.</p>}
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Medicamento {index + 1}</p>
              <Button variant="ghost" size="icon" aria-label="Quitar medicamento" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Medicamento y concentración" id={`med-${index}`}>
                <Input id={`med-${index}`} placeholder="Acetaminofén 500 mg" value={item.medication} onChange={(e) => update(index, { medication: e.target.value })} />
              </Field>
              <Field label="Presentación" id={`pres-${index}`}>
                <Input id={`pres-${index}`} placeholder="Tableta" value={item.presentation} onChange={(e) => update(index, { presentation: e.target.value })} />
              </Field>
              <Field label="Dosis" id={`dose-${index}`}>
                <Input id={`dose-${index}`} placeholder="1 tableta" value={item.dose} onChange={(e) => update(index, { dose: e.target.value })} />
              </Field>
              <Field label="Vía" id={`route-${index}`}>
                <Select id={`route-${index}`} value={item.route} onChange={(e) => update(index, { route: e.target.value })}>
                  {Object.entries(ROUTES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Frecuencia" id={`freq-${index}`}>
                <Input id={`freq-${index}`} placeholder="Cada 8 horas" value={item.frequency} onChange={(e) => update(index, { frequency: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Días" id={`days-${index}`}>
                  <Input id={`days-${index}`} type="number" min={1} max={365} value={item.durationDays} onChange={(e) => update(index, { durationDays: Number(e.target.value) })} />
                </Field>
                <Field label="Cantidad" id={`qty-${index}`}>
                  <Input id={`qty-${index}`} type="number" min={1} max={1000} value={item.quantity} onChange={(e) => update(index, { quantity: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="Indicaciones" id={`ind-${index}`} wide>
                <Input id={`ind-${index}`} placeholder="Después de las comidas" value={item.instructions} onChange={(e) => update(index, { instructions: e.target.value })} />
              </Field>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
