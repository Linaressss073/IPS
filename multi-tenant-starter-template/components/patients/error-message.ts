import { ApiError } from "@/lib/api/client";

const MESSAGES: Record<string, string> = {
  DOCUMENT_ALREADY_REGISTERED: "Ya existe un paciente con ese documento en esta IPS.",
  PATIENT_VERSION_CONFLICT:
    "Otra persona modificó este paciente mientras lo editabas. Recarga para ver los cambios.",
  PATIENT_NOT_FOUND: "El paciente no existe en esta IPS.",
  INVALID_REQUESTER: "Quien solicita debe ser miembro de esta IPS.",
  INVALID_BIRTH_DATE: "La fecha de nacimiento no puede ser futura ni de hace más de 130 años.",
  NOT_A_TEAM_MEMBER: "No eres miembro de esta IPS.",
  TEAM_ADMIN_REQUIRED: "Solo los administradores de la IPS pueden hacer esto.",
  PERMISSION_DENIED: "Tus roles en esta IPS no permiten esta acción.",
  STAFF_MEMBER_NOT_FOUND: "Esa persona no pertenece a esta IPS.",
  SERVICE_NOT_FOUND: "El servicio no existe en esta IPS.",
  LOCATION_NOT_FOUND: "La ubicación no existe en esta IPS.",
  AGENDA_NOT_FOUND: "La agenda ya no existe.",
  APPOINTMENT_NOT_FOUND: "La cita no existe en esta IPS.",
  SERVICE_CODE_TAKEN: "Otro servicio ya usa ese prefijo.",
  LOCATION_TAKEN: "Esa ubicación ya existe.",
  INACTIVE_RESOURCE: "El servicio o la ubicación están inactivos.",
  NOT_A_PROFESSIONAL: "Esa persona no tiene el rol Médico en esta IPS.",
  AGENDA_OVERLAP: "El profesional o el consultorio ya tienen una agenda que se cruza con ese horario.",
  AGENDA_HAS_APPOINTMENTS: "La agenda tiene citas activas; cancélalas o muévelas primero.",
  INVALID_AGENDA: "El horario no se divide en cupos completos o el fin es antes del inicio.",
  SCHEDULE_IN_THE_PAST: "No se puede agendar en el pasado.",
  SLOT_NOT_IN_AGENDA: "Esa hora no es un cupo de la agenda.",
  SLOT_TAKEN: "Otra persona acaba de tomar ese cupo. Elige otro.",
  PATIENT_ALREADY_BOOKED: "El paciente ya tiene una cita a esa hora.",
  INVALID_APPOINTMENT_TRANSITION: "La cita ya no está en un estado que permita esa acción.",
  RESCHEDULE_SERVICE_MISMATCH: "Solo se puede mover a una agenda del mismo servicio.",
  APPOINTMENT_VERSION_CONFLICT: "Otra persona modificó la cita. Recarga para ver los cambios.",
  INVALID_ACCESS_TOKEN: "Tu sesión expiró. Vuelve a iniciar sesión.",
  TURN_NOT_FOUND: "El turno no existe en esta IPS.",
  ALREADY_CHECKED_IN: "Este paciente ya registró su llegada para esta cita.",
  APPOINTMENT_NOT_TODAY: "Solo se registra la llegada de citas de hoy.",
  APPOINTMENT_NOT_ADMISSIBLE: "La cita está cancelada o ya no admite llegada.",
  INVALID_TURN_TRANSITION: "El turno ya no está en un estado que permita esa acción.",
  MAX_CALLS_REACHED: "El turno ya se llamó el máximo de veces.",
  TURN_VERSION_CONFLICT: "El turno cambió (otro llamado o un reanuncio). Se actualizó la lista; inténtalo de nuevo.",
  ORGANIZATION_NOT_FOUND: "La IPS no existe o fue eliminada.",
  ORGANIZATION_VERSION_CONFLICT:
    "Otra persona modificó los datos de la IPS mientras los editabas. Recarga para ver los cambios.",
};

/** Spanish message for known API error codes; the API message otherwise. */
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return (error.code && MESSAGES[error.code]) || error.message;
  }
  return "Algo salió mal. Inténtalo de nuevo.";
}
