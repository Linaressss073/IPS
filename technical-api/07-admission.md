# Admisión y turnos

[← Índice](README.md)

El paciente llega por su cita de hoy, Admisión registra la llegada y recibe un **turno por servicio y día**
(`RTH 1`, `RTH 2`…). Quien atiende lo llama: aparece en la **pantalla de sala** (“RTH 4 · Consultorio 502”), se
**reanuncia solo** cada intervalo y, si nadie llega tras el último llamado, el turno se cierra como **no se presentó**.
Rutas bajo `/api/v1/teams/:teamId`.

```
llegada ──► en_espera ──llamar──► anunciado ──(reanuncio automático)──► … ──► no_se_presento
                │                     │
                └──────── atendido ◄──┘   (cierre)
```

| Permiso | Quién lo tiene |
|---|---|
| `admission:manage` | Administrador, admisión |
| `turns:call` | Admisión, médico, farmacia |
| Miembro de la IPS | Pantalla de sala y configuración (lectura) |

## Registrar llegada

```http
POST /api/v1/teams/:teamId/turns
```

**Permiso:** `admission:manage`. Cuerpo: `{ "appointmentId": "9b7e…" }` (y `requestedBy` opcional).

| Regla | Error |
|---|---|
| La cita existe en la IPS | 404 `APPOINTMENT_NOT_FOUND` |
| Es de hoy (Colombia) | 400 `APPOINTMENT_NOT_TODAY` |
| Está agendada o confirmada | 409 `APPOINTMENT_NOT_ADMISSIBLE` |
| No tiene ya un turno (dos registros simultáneos: gana uno) | 409 `ALREADY_CHECKED_IN` |

**201** con un `TurnView`. El número sale de un contador por IPS, día y prefijo, tomado en la misma transacción.

## Turnos del día

```http
GET /api/v1/teams/:teamId/turns?date=&status=&professionalId=
```

**Permiso:** `turns:call` o `admission:manage`. Por defecto, hoy; orden de llegada. `status`: `en_espera`,
`anunciado`, `atendido`, `no_se_presento`.

### TurnView

```json
{
  "id": "5c1d…",
  "label": "RTH 4",
  "code": "RTH",
  "number": 4,
  "status": "anunciado",
  "calls": 1,
  "lastCalledAt": "2026-10-05T12:21:00.000Z",
  "arrivedAt": "2026-10-05T12:10:00.000Z",
  "closedAt": null,
  "date": "2026-10-05",
  "appointment": { "id": "9b7e…", "time": "07:20" },
  "patient": { "id": "1253…", "fullName": "Andrés Gómez Ruiz", "shortName": "Andrés Gómez", "document": { "type": "CC", "number": "1000123456" } },
  "professional": { "userId": "user_2abc…", "displayName": "Carolina Gómez" },
  "service": { "id": "6f1c…", "code": "RTH", "name": "Rehabilitación" },
  "location": { "id": "a2d9…", "label": "Consultorio 502" },
  "version": 2
}
```

## Llamar, atender, no se presentó

| Método | Ruta | Permiso | Efecto |
|---|---|---|---|
| POST | `/turns/:turnId/call` | `turns:call` | `en_espera`/`anunciado` → `anunciado`, `calls + 1` (máximo: 409 `MAX_CALLS_REACHED`) |
| POST | `/turns/:turnId/attend` | `turns:call` | → `atendido` (cierre); también sin llamado previo |
| POST | `/turns/:turnId/no-show` | `turns:call` o `admission:manage` | → `no_se_presento` (cierre manual) |

Cuerpo: `{ "version": 2 }`. Versión vieja → 409 `TURN_VERSION_CONFLICT` (por ejemplo, un reanuncio automático
justo antes). Turno cerrado → 409 `INVALID_TURN_TRANSITION`. **200** con el `TurnView`.

## Reanuncio automático

La API revisa cada `TURN_ANNOUNCER_INTERVAL_MS` (10 s por defecto) los turnos anunciados. Si pasó el intervalo de
la IPS desde el último llamado:

- con llamados pendientes → otro llamado (`calls + 1`);
- tras el último → `no_se_presento`.

Ambos quedan en el historial del paciente como hechos por `system` (`data.automatic: true`). Los guardados son
condicionales por versión, así varias instancias no duplican un paso.

## Pantalla de sala

```http
GET /api/v1/teams/:teamId/turns/board
```

**Acceso:** cualquier miembro (un televisor con una cuenta del personal). Solo turno, lugar y **nombre y primer
apellido**: nunca el documento.

```json
{
  "current": { "turnId": "5c1d…", "label": "RTH 4", "location": "Consultorio 502", "patientName": "Andrés Gómez", "status": "anunciado", "calls": 1, "calledAt": "…" },
  "recent": [ { "label": "MG 12", "location": "Consultorio 301", "status": "atendido", "…": "…" } ],
  "settings": { "announceIntervalSeconds": 120, "maxCalls": 3 }
}
```

`current` es el turno anunciado más reciente (o `null`); `recent`, los 6 llamados anteriores del día.

## Configuración del llamado

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/admission/settings` | Miembro |
| PUT | `/admission/settings` | `settings:manage` |

```json
{ "announceIntervalSeconds": 120, "maxCalls": 3 }
```

Intervalo de 30 a 900 s y de 1 a 5 llamados (si no, 400 `INVALID_VALUE`). Por defecto: 3 llamados cada 2 minutos.

## Historial del paciente

| `type` | `data` |
|---|---|
| `turn.checked_in` | `turnId`, `label`, `status`, `calls`, `appointmentId`, `service`, `location` |
| `turn.called` | Igual; `automatic: true` en los reanuncios |
| `turn.attended` | Igual |
| `turn.no_show` | Igual; `automatic: true` si lo cerró el reanuncio |

Los turnos de farmacia (`FAR n`) se crean desde [Farmacia](09-pharmacy.md#dar-turno) y traen `origin: { kind: "farmacia" }`; los de cita, `origin: { kind: "cita" }`.

Colecciones: `admission_turns` (índice único por `appointment.id`), `admission_turn_counters`, `admission_settings`.
