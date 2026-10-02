"use client";

import * as React from "react";
import { errorMessage } from "@/components/patients/error-message";
import { Field, Select } from "@/components/patients/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Location, OpenAgendaInput, Professional, Service } from "@/lib/api/scheduling";

/** Opens a block of a professional's time, split into equal slots. */
export function OpenAgendaForm(props: {
  date: string;
  services: Service[];
  locations: Location[];
  professionals: Professional[];
  onSubmit: (input: OpenAgendaInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = React.useState<OpenAgendaInput>({
    professionalId: "",
    serviceId: "",
    locationId: "",
    date: props.date,
    startTime: "07:00",
    endTime: "12:00",
    slotMinutes: 20,
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = <K extends keyof OpenAgendaInput>(key: K, value: OpenAgendaInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  const services = props.services.filter((s) => s.active);
  const locations = props.locations.filter((l) => l.active);
  const missing = [
    props.professionals.length === 0 && "profesionales (personas con el rol Médico en Administración → Personal)",
    services.length === 0 && "servicios activos",
    locations.length === 0 && "consultorios activos",
  ].filter(Boolean);

  if (missing.length > 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Para abrir una agenda faltan {missing.join(", ")}. Un administrador los configura en Administración.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
          await props.onSubmit(input);
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Profesional" id="agenda-professional">
          <Select
            id="agenda-professional"
            required
            value={input.professionalId}
            onChange={(e) => set("professionalId", e.target.value)}
          >
            <option value="">Elegir…</option>
            {props.professionals.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.displayName ?? p.userId}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Servicio" id="agenda-service">
          <Select id="agenda-service" required value={input.serviceId} onChange={(e) => set("serviceId", e.target.value)}>
            <option value="">Elegir…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Consultorio" id="agenda-location">
          <Select id="agenda-location" required value={input.locationId} onChange={(e) => set("locationId", e.target.value)}>
            <option value="">Elegir…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha" id="agenda-date">
          <Input id="agenda-date" type="date" required value={input.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Desde" id="agenda-start">
            <Input id="agenda-start" type="time" required value={input.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="Hasta" id="agenda-end">
            <Input id="agenda-end" type="time" required value={input.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </Field>
        </div>
        <Field label="Duración del cupo (min)" id="agenda-slot">
          <Input
            id="agenda-slot"
            type="number"
            min={5}
            max={240}
            step={5}
            required
            value={input.slotMinutes}
            onChange={(e) => set("slotMinutes", Number(e.target.value))}
          />
        </Field>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Abriendo…" : "Abrir agenda"}
        </Button>
        <Button type="button" variant="ghost" onClick={props.onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
