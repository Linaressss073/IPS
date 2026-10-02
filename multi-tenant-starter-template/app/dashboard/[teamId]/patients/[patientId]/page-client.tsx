"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { errorMessage } from "@/components/patients/error-message";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { CompanionsCard } from "@/components/patients/companions-card";
import { PatientAppointmentsCard } from "@/components/scheduling/patient-appointments-card";
import { PatientForm } from "@/components/patients/patient-form";
import { memberName, TeamMember, useTeamMembers } from "@/components/patients/use-team-members";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ageFrom,
  Companion,
  DOCUMENT_TYPES,
  getPatient,
  getPatientTimeline,
  Patient,
  REGIMES,
  RELATIONSHIPS,
  SEXES,
  TIMELINE_EVENTS,
  TimelineEntry,
  updatePatient,
} from "@/lib/api/patients";
import { useApiAuth } from "@/lib/api/use-api-auth";

/** The timeline is read from Mongo, which lags the write by up to one relay interval. */
const TIMELINE_REFRESH_DELAY_MS = 1000;

export function PageClient() {
  const { teamId, patientId } = useParams<{ teamId: string; patientId: string }>();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const canWrite = can("patients:write");
  const members = useTeamMembers();

  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [timeline, setTimeline] = React.useState<TimelineEntry[] | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadPatient = React.useCallback(async () => {
    setError(null);
    try {
      setPatient(await getPatient(auth, teamId, patientId));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [auth, teamId, patientId]);

  const loadTimeline = React.useCallback(async () => {
    try {
      setTimeline(await getPatientTimeline(auth, teamId, patientId));
    } catch {
      setTimeline([]);
    }
  }, [auth, teamId, patientId]);

  React.useEffect(() => {
    loadPatient();
    loadTimeline();
  }, [loadPatient, loadTimeline]);

  const listUrl = `/dashboard/${teamId}/patients`;

  if (access && !can("patients:read")) return <NoPermission what="ver pacientes" />;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={listUrl}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Pacientes
        </Link>
      </Button>

      {error && (
        <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {patient === null ? (
        !error && <Skeleton className="h-48 w-full max-w-3xl" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{patient.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {patient.document.type} {patient.document.number} · {ageFrom(patient.birthDate)} años
              </p>
            </div>
            {!editing && canWrite && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{editing ? "Editar datos" : "Ficha"}</CardTitle>
                  {editing && (
                    <CardDescription>
                      Si otra persona guardó cambios mientras editabas, se te pedirá recargar.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <PatientForm
                      // Remount with fresh data after each save.
                      key={patient.version}
                      patient={patient}
                      members={members}
                      submitLabel="Guardar cambios"
                      onCancel={() => setEditing(false)}
                      onSubmit={async (input) => {
                        setPatient(await updatePatient(auth, teamId, patientId, patient.version, input));
                        setEditing(false);
                        setTimeout(loadTimeline, TIMELINE_REFRESH_DELAY_MS);
                      }}
                    />
                  ) : (
                    <PatientDetails patient={patient} />
                  )}
                </CardContent>
              </Card>

              {can("appointments:read") && (
                <PatientAppointmentsCard
                  auth={auth}
                  teamId={teamId}
                  patientId={patientId}
                  canBook={can("appointments:manage")}
                />
              )}

              <CompanionsCard
                canRecord={canWrite}
                auth={auth}
                teamId={teamId}
                patientId={patientId}
                members={members}
                onRecorded={() => setTimeout(loadTimeline, TIMELINE_REFRESH_DELAY_MS)}
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle>Historial</CardTitle>
                  <CardDescription>Todo lo que ha pasado con este paciente.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => loadTimeline()} aria-label="Actualizar historial">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Timeline entries={timeline} members={members} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function PatientDetails({ patient }: { patient: Patient }) {
  const rows: [string, React.ReactNode][] = [
    ["Documento", `${DOCUMENT_TYPES[patient.document.type] ?? patient.document.type} · ${patient.document.number}`],
    ["Fecha de nacimiento", patient.birthDate],
    ["Sexo biológico", SEXES[patient.sex] ?? patient.sex],
    ["Correo electrónico", patient.contact.email],
    ["Teléfono", patient.contact.phone ?? "—"],
    ["Dirección", patient.contact.address ?? "—"],
    ["Régimen", REGIMES[patient.affiliation.regime] ?? patient.affiliation.regime],
    ["EPS", patient.affiliation.eps ?? "No aplica"],
    ["Registrado", formatDateTime(patient.registeredAt)],
    ["Última modificación", formatDateTime(patient.updatedAt)],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const FIELD_LABELS: Record<string, string> = {
  document: "documento",
  name: "nombre",
  birthDate: "fecha de nacimiento",
  sex: "sexo",
  contact: "contacto",
  affiliation: "afiliación",
};

function Timeline(props: { entries: TimelineEntry[] | null; members: TeamMember[] }) {
  if (props.entries === null) return <Skeleton className="h-24 w-full" />;
  if (props.entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin eventos todavía.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l pl-4">
      {[...props.entries].reverse().map((entry) => {
        const changes = (entry.data.changes as { field: string }[] | undefined) ?? [];
        const requester = memberName(props.members, entry.requestedBy, entry.requestedByName);
        const executor = memberName(props.members, entry.executedBy, entry.executedByName);
        return (
          <li key={entry.id} className="text-sm">
            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border bg-background" />
            <p className="font-medium">
              {TIMELINE_EVENTS[entry.type] ?? entry.type}
              {entry.type === "patient.companion_recorded" && <> #{String(entry.data.number)}</>}
            </p>
            {entry.type === "patient.companion_recorded" && (
              <p className="text-muted-foreground">{companionSummary(entry.data)}</p>
            )}
            {entry.type.startsWith("appointment.") && (
              <p className="text-muted-foreground">{appointmentSummary(entry.data)}</p>
            )}
            {changes.length > 0 && (
              <p className="text-muted-foreground">
                Cambió: {changes.map((change) => FIELD_LABELS[change.field] ?? change.field).join(", ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDateTime(entry.occurredAt)} · por {executor}
              {entry.requestedBy !== entry.executedBy && <> · solicitado por {requester}</>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function companionSummary(data: Record<string, unknown>) {
  const companion = data as Partial<Companion>;
  const name = companion.name
    ? [companion.name.firstName, companion.name.firstLastName].filter(Boolean).join(" ")
    : null;
  const relationship = companion.relationship ? RELATIONSHIPS[companion.relationship] : null;
  return [name ?? companion.phone, relationship].filter(Boolean).join(" · ");
}

type SlotData = { service?: { code: string; name: string }; location?: { label: string }; date?: string; time?: string };

/** "RTH Rehabilitación · Consultorio 502 · 5 oct 2026, 07:20 (antes: …) · Motivo: …" */
function appointmentSummary(data: Record<string, unknown>) {
  const slot = (value: SlotData) =>
    [
      value.service && `${value.service.code} ${value.service.name}`,
      value.location?.label,
      value.date &&
        `${new Date(`${value.date}T12:00:00Z`).toLocaleDateString("es-CO", { dateStyle: "medium", timeZone: "UTC" })}, ${value.time}`,
    ]
      .filter(Boolean)
      .join(" · ");
  const from = data.from as SlotData | undefined;
  return [
    slot(data as SlotData),
    from && `antes: ${from.date}, ${from.time}`,
    typeof data.reason === "string" && `Motivo: ${data.reason}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}
