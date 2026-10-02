# Agendamiento

[← Índice](README.md)

Servicios y consultorios de la IPS, agendas de los profesionales divididas en cupos y citas de pacientes ya
registrados. Todas las rutas van bajo `/api/v1/teams/:teamId` y exigen token y membresía de la IPS, además del
permiso indicado. **Horas en hora de Colombia** (UTC−5, sin horario de verano): fechas `YYYY-MM-DD` y horas
`HH:MM`; `startsAt` va en ISO UTC.

| Permiso | Quién lo tiene |
|---|---|
| `appointments:read` | Administrador, agendamiento, admisión, médico |
| `appointments:manage` | Administrador, agendamiento |
| `settings:manage` | Administrador |

- [Servicios](#servicios) · [Ubicaciones](#ubicaciones) · [Profesionales](#profesionales)
- [Agendas](#agendas) · [Citas](#citas) · [Historial del paciente](#historial-del-paciente)

---

## Servicios

| Método | Ruta | Permiso | Respuesta |
|---|---|---|---|
| GET | `/services` | `appointments:read` | 200 `ServiceView[]` (por nombre) |
| POST | `/services` | `settings:manage` | 201 `ServiceView` |
| PATCH | `/services/:serviceId` | `settings:manage` | 200 `ServiceView` |

```json
{ "code": "rth", "name": "Rehabilitación" }
```

```json
{ "id": "6f1c…", "code": "RTH", "name": "Rehabilitación", "active": true }
```

- `code`: **prefijo de los turnos** del servicio (p. ej. "RTH 4" en la pantalla de llamado). 2 a 4 letras, se guarda en
  mayúsculas y es único en la IPS (409 `SERVICE_CODE_TAKEN`). No se puede cambiar.
- `PATCH` acepta `name` y/o `active`. Un servicio inactivo no recibe agendas ni citas nuevas; nunca se borra.

## Ubicaciones

| Método | Ruta | Permiso | Respuesta |
|---|---|---|---|
| GET | `/locations` | `appointments:read` | 200 `LocationView[]` |
| POST | `/locations` | `settings:manage` | 201 `LocationView` |
| PATCH | `/locations/:locationId` | `settings:manage` | 200 `LocationView` (`{ "active": false }`) |

```json
{ "kind": "consultorio", "number": "502" }
```

```json
{ "id": "a2d9…", "kind": "Consultorio", "number": "502", "label": "Consultorio 502", "active": true }
```

`kind` 2-40 caracteres; `number` 1-10 letras, dígitos o `-`. Tipo + número es único en la IPS sin distinguir
mayúsculas ni tildes (409 `LOCATION_TAKEN`).

## Profesionales

```http
GET /api/v1/teams/:teamId/professionals
```

**Permiso:** `appointments:read`. Las personas con el rol **médico** en la IPS ([roles](03-staff.md#asignar-roles)):

```json
[{ "userId": "user_2abc…", "displayName": "Carolina Gómez" }]
```

---

## Agendas

Un bloque de tiempo de un profesional para un servicio en una ubicación, dividido en cupos iguales.

### Ver el día

```http
GET /api/v1/teams/:teamId/agendas?date=2026-10-05&professionalId=…&serviceId=…
```

**Permiso:** `appointments:read`. `date` obligatorio; los filtros son opcionales.

```json
[
  {
    "id": "c0e4…",
    "date": "2026-10-05",
    "startTime": "07:00",
    "endTime": "08:00",
    "slotMinutes": 20,
    "professional": { "userId": "user_2abc…", "displayName": "Carolina Gómez" },
    "service": { "id": "6f1c…", "code": "RTH", "name": "Rehabilitación" },
    "location": { "id": "a2d9…", "label": "Consultorio 502" },
    "slots": [
      { "time": "07:00", "startsAt": "2026-10-05T12:00:00.000Z", "appointment": null },
      {
        "time": "07:20",
        "startsAt": "2026-10-05T12:20:00.000Z",
        "appointment": { "id": "9b7e…", "status": "agendada", "patient": { "id": "1253…", "fullName": "Andrés Gómez" } }
      }
    ]
  }
]
```

### Abrir una agenda

```http
POST /api/v1/teams/:teamId/agendas
```

**Permiso:** `appointments:manage`. Responde **201** `{ "id": "…" }`.

```json
{
  "professionalId": "user_2abc…",
  "serviceId": "6f1c…",
  "locationId": "a2d9…",
  "date": "2026-10-05",
  "startTime": "07:00",
  "endTime": "12:00",
  "slotMinutes": 20
}
```

| Regla | Error |
|---|---|
| El profesional debe tener el rol médico | 400 `NOT_A_PROFESSIONAL` |
| Servicio y ubicación activos | 400 `INACTIVE_RESOURCE` |
| `slotMinutes` de 5 a 240; fin después del inicio; el bloque se divide en cupos completos | 400 `INVALID_AGENDA` |
| Fecha de hoy en adelante | 400 `SCHEDULE_IN_THE_PAST` |
| Ni el profesional ni la ubicación tienen otra agenda que se cruce | 409 `AGENDA_OVERLAP` |

### Eliminar una agenda

```http
DELETE /api/v1/teams/:teamId/agendas/:agendaId
```

**Permiso:** `appointments:manage`. **204** si no tiene citas activas; si las tiene, 409 `AGENDA_HAS_APPOINTMENTS`.

---

## Citas

```
agendada ──confirmar──► confirmada ──► (admisión: en espera, anunciado, atendido / no se presentó)
   │  ▲                     │
   │  └──── reprogramar ◄───┤
   └──────── cancelar ──────┴──► cancelada
```

| Método | Ruta | Permiso | Respuesta |
|---|---|---|---|
| GET | `/appointments?date=&patientId=&professionalId=&status=` | `appointments:read` | 200 `AppointmentView[]` |
| GET | `/appointments/:appointmentId` | `appointments:read` | 200 `AppointmentView` |
| POST | `/appointments` | `appointments:manage` | 201 `AppointmentView` |
| POST | `/appointments/:appointmentId/confirm` | `appointments:manage` | 200 `AppointmentView` |
| POST | `/appointments/:appointmentId/cancel` | `appointments:manage` | 200 `AppointmentView` |
| POST | `/appointments/:appointmentId/reschedule` | `appointments:manage` | 200 `AppointmentView` |

### Buscar

Hay que filtrar por `date`, `patientId` o `professionalId` (si no, 400 `INVALID_VALUE`); `status` es opcional
(`agendada`, `confirmada`, `cancelada`). Orden por hora; máximo 500.

### Agendar

```json
{ "patientId": "1253…", "agendaId": "c0e4…", "time": "07:20", "requestedBy": "user_…" }
```

| Regla | Error |
|---|---|
| El paciente existe en la IPS | 404 `PATIENT_NOT_FOUND` |
| `time` es un cupo de la agenda | 400 `SLOT_NOT_IN_AGENDA` |
| El cupo es futuro | 400 `SCHEDULE_IN_THE_PAST` |
| El cupo está libre (dos reservas simultáneas: gana una) | 409 `SLOT_TAKEN` |
| El paciente no tiene otra cita a la misma hora | 409 `PATIENT_ALREADY_BOOKED` |

### Confirmar, cancelar, reprogramar

Todas llevan `version` (la que leyó el cliente; si alguien cambió la cita → 409 `APPOINTMENT_VERSION_CONFLICT`) y
`requestedBy` opcional.

```json
{ "version": 1 }
{ "version": 2, "reason": "El paciente viaja fuera de la ciudad" }
{ "version": 2, "agendaId": "d81f…", "time": "09:40" }
```

- **Confirmar**: solo desde `agendada`.
- **Cancelar**: desde `agendada` o `confirmada`, con motivo de 3 a 200 caracteres. Libera el cupo.
- **Reprogramar**: a otro cupo libre de **una agenda del mismo servicio** (otro día, hora, profesional o lugar;
  si no, 400 `RESCHEDULE_SERVICE_MISMATCH`). Vuelve a `agendada` para que el paciente confirme la nueva hora.
- Un paso no permitido por el estado → 409 `INVALID_APPOINTMENT_TRANSITION`.

### AppointmentView

```json
{
  "id": "9b7e…",
  "status": "agendada",
  "patient": { "id": "1253…", "fullName": "Andrés Gómez", "document": { "type": "CC", "number": "1000123456" } },
  "professional": { "userId": "user_2abc…", "displayName": "Carolina Gómez" },
  "service": { "id": "6f1c…", "code": "RTH", "name": "Rehabilitación" },
  "location": { "id": "a2d9…", "label": "Consultorio 502" },
  "agendaId": "c0e4…",
  "date": "2026-10-05",
  "time": "07:20",
  "endTime": "07:40",
  "startsAt": "2026-10-05T12:20:00.000Z",
  "cancelReason": null,
  "version": 1,
  "createdAt": "2026-10-02T15:00:00.000Z",
  "updatedAt": "2026-10-02T15:00:00.000Z"
}
```

Servicio y ubicación se copian al agendar: si luego se renombran, la cita conserva lo que se le dijo al paciente.
Nombres de paciente y profesional se resuelven al leer.

---

## Historial del paciente

Cada paso queda en el [historial del paciente](02-patients.md#historial-del-paciente-timeline):

| `type` | `data` |
|---|---|
| `appointment.scheduled` | `appointmentId`, `status`, `service`, `location`, `professionalId`, `date`, `time`, `startsAt` |
| `appointment.confirmed` | Igual |
| `appointment.rescheduled` | Igual (nuevo cupo) + `from` (cupo anterior) |
| `appointment.cancelled` | Igual + `reason` |

Los cambios de configuración también se trazan, sin paciente: `scheduling.service_created`,
`scheduling.service_updated`, `scheduling.location_created`, `scheduling.location_updated`,
`scheduling.agenda_opened`, `scheduling.agenda_deleted`.

## Colecciones (MongoDB)

`scheduling_services`, `scheduling_locations`, `scheduling_agendas`, `scheduling_appointments`. Las citas activas
tienen dos índices únicos parciales: uno por cupo (`agendaId` + hora) y otro por paciente y hora, así la base de
datos decide las reservas simultáneas.
