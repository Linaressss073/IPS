import { apiFetch, TokenSource } from "./client";

/** Mirrors the views of api/src/contexts/scheduling/application/types/scheduling.types.ts. */
export type Service = { id: string; code: string; name: string; active: boolean };
export type Location = { id: string; kind: string; number: string; label: string; active: boolean };
export type Professional = { userId: string; displayName: string | null };

export type Slot = {
  time: string;
  startsAt: string;
  appointment: {
    id: string;
    status: AppointmentStatus;
    patient: { id: string; fullName: string | null };
  } | null;
};

export type Agenda = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  professional: Professional;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  slots: Slot[];
};

export type AppointmentStatus = "agendada" | "confirmada" | "cancelada";

export type Appointment = {
  id: string;
  status: AppointmentStatus;
  patient: { id: string; fullName: string | null; document: { type: string; number: string } | null };
  professional: Professional;
  service: { id: string; code: string; name: string };
  location: { id: string; label: string };
  agendaId: string;
  date: string;
  time: string;
  endTime: string;
  startsAt: string;
  cancelReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type OpenAgendaInput = {
  professionalId: string;
  serviceId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

export const APPOINTMENT_STATUSES: Record<AppointmentStatus, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const team = (teamId: string) => `/teams/${encodeURIComponent(teamId)}`;
const json = (body: unknown, method = "POST"): RequestInit => ({ method, body: JSON.stringify(body) });

export const listServices = (auth: TokenSource, teamId: string) =>
  apiFetch<Service[]>(auth, `${team(teamId)}/services`);

export const createService = (auth: TokenSource, teamId: string, input: { code: string; name: string }) =>
  apiFetch<Service>(auth, `${team(teamId)}/services`, json(input));

export const updateService = (
  auth: TokenSource,
  teamId: string,
  serviceId: string,
  changes: { name?: string; active?: boolean },
) => apiFetch<Service>(auth, `${team(teamId)}/services/${encodeURIComponent(serviceId)}`, json(changes, "PATCH"));

export const listLocations = (auth: TokenSource, teamId: string) =>
  apiFetch<Location[]>(auth, `${team(teamId)}/locations`);

export const createLocation = (auth: TokenSource, teamId: string, input: { kind: string; number: string }) =>
  apiFetch<Location>(auth, `${team(teamId)}/locations`, json(input));

export const setLocationActive = (auth: TokenSource, teamId: string, locationId: string, active: boolean) =>
  apiFetch<Location>(
    auth,
    `${team(teamId)}/locations/${encodeURIComponent(locationId)}`,
    json({ active }, "PATCH"),
  );

export const listProfessionals = (auth: TokenSource, teamId: string) =>
  apiFetch<Professional[]>(auth, `${team(teamId)}/professionals`);

export function getDayAgenda(
  auth: TokenSource,
  teamId: string,
  filter: { date: string; professionalId?: string; serviceId?: string },
) {
  const params = new URLSearchParams(
    Object.entries(filter).filter((entry): entry is [string, string] => !!entry[1]),
  );
  return apiFetch<Agenda[]>(auth, `${team(teamId)}/agendas?${params}`);
}

export const openAgenda = (auth: TokenSource, teamId: string, input: OpenAgendaInput) =>
  apiFetch<{ id: string }>(auth, `${team(teamId)}/agendas`, json(input));

export const deleteAgenda = (auth: TokenSource, teamId: string, agendaId: string) =>
  apiFetch<void>(auth, `${team(teamId)}/agendas/${encodeURIComponent(agendaId)}`, { method: "DELETE" });

export function searchAppointments(
  auth: TokenSource,
  teamId: string,
  filter: { date?: string; patientId?: string; professionalId?: string; status?: string },
) {
  const params = new URLSearchParams(
    Object.entries(filter).filter((entry): entry is [string, string] => !!entry[1]),
  );
  return apiFetch<Appointment[]>(auth, `${team(teamId)}/appointments?${params}`);
}

export const scheduleAppointment = (
  auth: TokenSource,
  teamId: string,
  input: { patientId: string; agendaId: string; time: string },
) => apiFetch<Appointment>(auth, `${team(teamId)}/appointments`, json(input));

const appointmentUrl = (teamId: string, id: string, action: string) =>
  `${team(teamId)}/appointments/${encodeURIComponent(id)}/${action}`;

export const confirmAppointment = (auth: TokenSource, teamId: string, a: Appointment) =>
  apiFetch<Appointment>(auth, appointmentUrl(teamId, a.id, "confirm"), json({ version: a.version }));

export const cancelAppointment = (auth: TokenSource, teamId: string, a: Appointment, reason: string) =>
  apiFetch<Appointment>(auth, appointmentUrl(teamId, a.id, "cancel"), json({ version: a.version, reason }));

export const rescheduleAppointment = (
  auth: TokenSource,
  teamId: string,
  a: Appointment,
  target: { agendaId: string; time: string },
) =>
  apiFetch<Appointment>(
    auth,
    appointmentUrl(teamId, a.id, "reschedule"),
    json({ version: a.version, ...target }),
  );

/** Today's date in Colombia (UTC-5), as YYYY-MM-DD. */
export function colombiaToday(now = new Date()): string {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "2026-10-05" -> "lunes, 5 de octubre de 2026". */
export function formatDay(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const getAppointment = (auth: TokenSource, teamId: string, appointmentId: string) =>
  apiFetch<Appointment>(auth, `${team(teamId)}/appointments/${encodeURIComponent(appointmentId)}`);
