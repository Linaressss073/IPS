# Épica 3: Agendamiento de citas

## Objetivo

Permitir que la IPS organice la oferta de la consulta externa (servicios, consultorios y agendas de sus médicos) y
asigne citas a pacientes ya registrados, sin dobles reservas y con cada paso trazado en el historial del paciente.
Es el inicio del recorrido: de la cita salen la admisión, el turno y la consulta.

**Estado:** implementada (commits `0da51cb` del 2 de octubre y `3ad22b8` del 3 de octubre de 2026).

## Documentos de referencia

- `api/README.md` (servicio, ubicación, agenda, cita).
- `technical-api/06-scheduling.md`.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Hora | Hora de Colombia (UTC−5, sin horario de verano). |
| Código del servicio | 2 a 4 letras, en mayúsculas, único en la IPS e inmutable: es el prefijo de los turnos (RTH 4). |
| Servicios y ubicaciones | Nunca se borran: se desactivan. Inactivos no reciben agendas ni citas nuevas. |
| Ubicación | Tipo + número ("Consultorio 502"), único sin importar mayúsculas ni tildes. |
| Agenda | Bloque de un médico, en un servicio y una ubicación, dividido en cupos iguales de 5 a 240 minutos; sin cruces de médico ni de ubicación. |
| Reservas simultáneas | La base de datos decide: dos reservas del mismo cupo, gana una. Un paciente no puede tener dos citas a la misma hora. |
| Estados de la cita | agendada → confirmada → (admisión); cancelada desde agendada o confirmada, con motivo. |
| Reprogramar | Solo a otro cupo libre del **mismo servicio**; vuelve a "agendada". |
| Datos copiados | Servicio y ubicación se copian en la cita: si luego se renombran, la cita conserva lo que se le dijo al paciente. |

## Orden de las historias

### Historia 1: Servicios y consultorios

**Prioridad**: no hay agenda sin servicio ni lugar.
El administrador crea los servicios (con su código de turno) y las ubicaciones de atención, y los activa o desactiva.
**Dependencias**: Épica 1.

### Historia 2: Agendas de los médicos con cupos

**Prioridad**: las citas se dan sobre cupos de una agenda.
Agendamiento abre agendas de un médico para un servicio y lugar, ve la vista previa de cupos y recibe errores de
horario específicos; puede eliminar una agenda sin citas activas.
**Dependencias**: Historia 1, Épica 1 (rol médico).

### Historia 3: Agendar una cita

**Prioridad**: es el valor central de la épica.
Agendamiento asigna un cupo libre a un paciente registrado; el sistema impide la doble reserva.
**Dependencias**: Historia 2, Épica 2.

### Historia 4: Confirmar, cancelar y reprogramar

**Prioridad**: la cita cambia antes de la atención.
Confirmar la asistencia, cancelar con motivo (liberando el cupo) o mover la cita a otro cupo del mismo servicio.
**Dependencias**: Historia 3.

## Contexto compartido para el detalle de historias

- **API:** `api/src/contexts/scheduling/` (`medical-service.entity.ts`, `care-location.entity.ts`,
  `agenda.entity.ts`, `appointment.entity.ts`, comandos `create-service`, `update-service`, `create-location`,
  `update-location`, `open-agenda`, `delete-agenda`, `schedule-appointment`, `confirm-appointment`,
  `cancel-appointment`, `reschedule-appointment`; controladores `scheduling-settings`, `agendas`, `appointments`).
- **Hora de Colombia:** `api/src/shared/domain/utils/colombia-time.ts`.
- **Frontend:** `app/dashboard/[teamId]/scheduling-settings`, `app/dashboard/[teamId]/agenda`,
  `components/scheduling/`, `lib/api/scheduling.ts`.
- **Pruebas:** `api/test/scheduling.e2e-spec.ts` y unitarios del contexto `scheduling`.
