"use client";

import * as React from "react";
import Link from "next/link";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Appointment, APPOINTMENT_STATUSES, formatDay } from "@/lib/api/scheduling";

/** Details of an appointment and what can be done with it. */
export function AppointmentPanel(props: {
  appointment: Appointment;
  teamId: string;
  canManage: boolean;
  onConfirm: () => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  onReschedule: () => void;
  /** Shown to the appointment's physician: opens (or resumes) its consultation. */
  onConsult?: () => Promise<void>;
}) {
  const { appointment: a } = props;
  const [reason, setReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const open = a.status !== "cancelada";

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, React.ReactNode][] = [
    ["Estado", APPOINTMENT_STATUSES[a.status]],
    [
      "Paciente",
      <Link key="p" className="underline" href={`/dashboard/${props.teamId}/patients/${a.patient.id}`}>
        {a.patient.fullName ?? a.patient.id}
        {a.patient.document && ` · ${a.patient.document.type} ${a.patient.document.number}`}
      </Link>,
    ],
    ["Fecha", `${formatDay(a.date)}, ${a.time}–${a.endTime}`],
    ["Servicio", `${a.service.code} · ${a.service.name}`],
    ["Lugar", a.location.label],
    ["Profesional", a.professional.displayName ?? a.professional.userId],
  ];
  if (a.cancelReason) rows.push(["Motivo de cancelación", a.cancelReason]);

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </React.Fragment>
        ))}
      </dl>

      {props.onConsult && open && (
        <Button size="sm" disabled={busy} onClick={() => run(props.onConsult!)}>
          Abrir consulta
        </Button>
      )}

      {props.canManage && open && !cancelling && (
        <div className="flex flex-wrap gap-2">
          {a.status === "agendada" && (
            <Button size="sm" disabled={busy} onClick={() => run(props.onConfirm)}>
              Confirmar asistencia
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={busy} onClick={props.onReschedule}>
            Reprogramar
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setCancelling(true)}>
            Cancelar cita
          </Button>
        </div>
      )}

      {cancelling && (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => props.onCancel(reason));
          }}
        >
          <Input
            autoFocus
            placeholder="Motivo (p. ej. el paciente no puede asistir)"
            value={reason}
            minLength={3}
            maxLength={200}
            required
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" type="submit" disabled={busy}>
              Cancelar la cita
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setCancelling(false)}>
              Volver
            </Button>
          </div>
        </form>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
