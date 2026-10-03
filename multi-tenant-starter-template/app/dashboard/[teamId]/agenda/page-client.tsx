"use client";

import * as React from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { errorMessage } from "@/components/patients/error-message";
import { Select } from "@/components/patients/form-controls";
import { AgendaCard } from "@/components/scheduling/agenda-card";
import { AppointmentPanel } from "@/components/scheduling/appointment-panel";
import { OpenAgendaForm } from "@/components/scheduling/open-agenda-form";
import { PatientPicker } from "@/components/scheduling/patient-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { startConsultation } from "@/lib/api/consultation";
import { getPatient, Patient } from "@/lib/api/patients";
import {
  Agenda,
  Appointment,
  cancelAppointment,
  colombiaToday,
  confirmAppointment,
  deleteAgenda,
  formatDay,
  getAppointment,
  getDayAgenda,
  listLocations,
  listProfessionals,
  listServices,
  Location,
  openAgenda,
  Professional,
  rescheduleAppointment,
  scheduleAppointment,
  Service,
  Slot,
} from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";
import { PageHeader, PageShell } from "@/components/page-header";

type Panel =
  | { kind: "book"; agenda: Agenda; slot: Slot }
  | { kind: "appointment"; appointment: Appointment };

/** Agendamiento: a day's agendas and their slots; book, confirm, move, cancel. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const canManage = can("appointments:manage");

  const [date, setDate] = React.useState(colombiaToday());
  const [professionalId, setProfessionalId] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [agendas, setAgendas] = React.useState<Agenda[] | null>(null);
  const [catalog, setCatalog] = React.useState<{
    services: Service[];
    locations: Location[];
    professionals: Professional[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [opening, setOpening] = React.useState(false);
  const [panel, setPanel] = React.useState<Panel | null>(null);
  /** Patient chosen beforehand (from their record) to book for. */
  const [patient, setPatient] = React.useState<Patient | null>(null);
  /** Appointment being moved: the next free slot picked becomes its new time. */
  const [moving, setMoving] = React.useState<Appointment | null>(null);
  const [now, setNow] = React.useState(() => new Date());

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setAgendas(await getDayAgenda(auth, teamId, { date, professionalId, serviceId }));
      setNow(new Date());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [auth, teamId, date, professionalId, serviceId]);

  React.useEffect(() => {
    if (access && can("appointments:read")) void load();
  }, [access, can, load]);

  React.useEffect(() => {
    if (!access || !can("appointments:read")) return;
    Promise.all([listServices(auth, teamId), listLocations(auth, teamId), listProfessionals(auth, teamId)])
      .then(([services, locations, professionals]) => setCatalog({ services, locations, professionals }))
      .catch((e) => setError(errorMessage(e)));
  }, [access, can, auth, teamId]);

  const preselected = searchParams.get("patientId");
  React.useEffect(() => {
    if (!preselected) return;
    getPatient(auth, teamId, preselected)
      .then(setPatient)
      .catch(() => setPatient(null));
  }, [auth, teamId, preselected]);

  if (access && !can("appointments:read")) return <NoPermission what="ver la agenda" />;

  const shiftDate = (days: number) => {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + days);
    setDate(next.toISOString().slice(0, 10));
  };

  const openAppointment = async (id: string) => {
    try {
      setPanel({ kind: "appointment", appointment: await getAppointment(auth, teamId, id) });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const afterChange = async (appointment: Appointment) => {
    setPanel({ kind: "appointment", appointment });
    await load();
  };

  const pickFree = async (agenda: Agenda, slot: Slot) => {
    if (!moving) {
      setPanel({ kind: "book", agenda, slot });
      return;
    }
    try {
      const moved = await rescheduleAppointment(auth, teamId, moving, { agendaId: agenda.id, time: slot.time });
      setMoving(null);
      await afterChange(moved);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Agendamiento"
        title="Agenda"
        description="Cupos de cada profesional por día, en hora de Colombia."
        actions={
          canManage &&
          !opening && (
            <Button onClick={() => setOpening(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Abrir agenda
            </Button>
          )
        }
      />

      {opening && catalog && (
        <Card>
          <CardHeader>
            <CardTitle>Abrir agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <OpenAgendaForm
              date={date}
              {...catalog}
              onCancel={() => setOpening(false)}
              onSubmit={async (input) => {
                await openAgenda(auth, teamId, input);
                setOpening(false);
                if (input.date === date) await load();
                else setDate(input.date);
              }}
            />
          </CardContent>
        </Card>
      )}

      {(patient || moving) && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm">
          {moving ? (
            <span>
              Reprogramando la cita de <strong>{moving.patient.fullName}</strong> ({moving.service.code},{" "}
              {formatDay(moving.date)} {moving.time}): elige un cupo libre del mismo servicio, en cualquier día.
            </span>
          ) : (
            <span>
              Agendando para <strong>{patient!.fullName}</strong> · {patient!.document.type} {patient!.document.number}:
              elige un cupo libre.
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            aria-label="Quitar"
            onClick={() => (moving ? setMoving(null) : setPatient(null))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Día anterior" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input type="date" className="w-40" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <Button variant="outline" size="sm" aria-label="Día siguiente" onClick={() => shiftDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDate(colombiaToday())}>
          Hoy
        </Button>
        <Select className="w-52" value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
          <option value="">Todos los profesionales</option>
          {catalog?.professionals.map((p) => (
            <option key={p.userId} value={p.userId}>
              {p.displayName ?? p.userId}
            </option>
          ))}
        </Select>
        <Select className="w-52" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          <option value="">Todos los servicios</option>
          {catalog?.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} · {s.name}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-sm capitalize text-muted-foreground">{formatDay(date)}</p>

      {error && (
        <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {agendas === null ? (
        <Skeleton className="h-40 w-full" />
      ) : agendas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay agendas abiertas para este día.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {agendas.map((agenda) => (
            <AgendaCard
              key={agenda.id}
              agenda={agenda}
              now={now}
              canPickFree={canManage && (!moving || agenda.service.id === moving.service.id)}
              onPickFree={pickFree}
              onOpenAppointment={openAppointment}
              onDelete={
                canManage
                  ? (a) =>
                      deleteAgenda(auth, teamId, a.id)
                        .then(load)
                        .catch((e) => setError(errorMessage(e)))
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <Sheet open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {panel?.kind === "book" && (
            <BookPanel
              agenda={panel.agenda}
              slot={panel.slot}
              patient={patient}
              teamId={teamId}
              onPick={setPatient}
              onBook={async (p) => {
                const booked = await scheduleAppointment(auth, teamId, {
                  patientId: p.id,
                  agendaId: panel.agenda.id,
                  time: panel.slot.time,
                });
                setPatient(null);
                await afterChange(booked);
              }}
            />
          )}
          {panel?.kind === "appointment" && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Cita</SheetTitle>
                <SheetDescription>
                  {panel.appointment.service.code} · {panel.appointment.time}
                </SheetDescription>
              </SheetHeader>
              <AppointmentPanel
                key={`${panel.appointment.id}:${panel.appointment.version}`}
                appointment={panel.appointment}
                teamId={teamId}
                canManage={canManage}
                onConfirm={async () => afterChange(await confirmAppointment(auth, teamId, panel.appointment))}
                onCancel={async (reason) =>
                  afterChange(await cancelAppointment(auth, teamId, panel.appointment, reason))
                }
                onReschedule={() => {
                  setMoving(panel.appointment);
                  setPanel(null);
                }}
                onConsult={
                  can("clinical:write") && panel.appointment.professional.userId === access?.userId
                    ? async () => {
                        const consultation = await startConsultation(auth, teamId, panel.appointment.id);
                        router.push(`/dashboard/${teamId}/consultations/${consultation.id}`);
                      }
                    : undefined
                }
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

function BookPanel(props: {
  agenda: Agenda;
  slot: Slot;
  patient: Patient | null;
  teamId: string;
  onPick: (patient: Patient) => void;
  onBook: (patient: Patient) => Promise<void>;
}) {
  const auth = useApiAuth();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { agenda, slot, patient } = props;

  return (
    <>
      <SheetHeader className="mb-4">
        <SheetTitle>Agendar cita</SheetTitle>
        <SheetDescription>
          {agenda.service.code} · {agenda.service.name} · {agenda.location.label}
          <br />
          <span className="capitalize">{formatDay(agenda.date)}</span>, {slot.time} ·{" "}
          {agenda.professional.displayName ?? agenda.professional.userId}
        </SheetDescription>
      </SheetHeader>
      {patient ? (
        <div className="space-y-4">
          <p className="text-sm">
            Paciente: <strong>{patient.fullName}</strong> · {patient.document.type} {patient.document.number}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                await props.onBook(patient);
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Agendando…" : `Agendar a las ${slot.time}`}
          </Button>
        </div>
      ) : (
        <PatientPicker auth={auth} teamId={props.teamId} onPick={props.onPick} />
      )}
    </>
  );
}
