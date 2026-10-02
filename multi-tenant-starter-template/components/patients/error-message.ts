import { ApiError } from "@/lib/api/client";

const MESSAGES: Record<string, string> = {
  DOCUMENT_ALREADY_REGISTERED: "Ya existe un paciente con ese documento en esta IPS.",
  PATIENT_VERSION_CONFLICT:
    "Otra persona modificó este paciente mientras lo editabas. Recarga para ver los cambios.",
  PATIENT_NOT_FOUND: "El paciente no existe en esta IPS.",
  INVALID_REQUESTER: "Quien solicita debe ser miembro de esta IPS.",
  INVALID_BIRTH_DATE: "La fecha de nacimiento no puede ser futura ni de hace más de 130 años.",
  NOT_A_TEAM_MEMBER: "No eres miembro de esta IPS.",
};

/** Spanish message for known API error codes; the API message otherwise. */
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return (error.code && MESSAGES[error.code]) || error.message;
  }
  return "Algo salió mal. Inténtalo de nuevo.";
}
