# Pacientes

[← Índice](README.md)

Registro único de cada paciente por IPS (nadie vuelve a pedirle sus datos), con su historial y sus acompañantes.
Todas las rutas exigen token y ser miembro de la IPS `:teamId`. Las consultas exigen el permiso **`patients:read`**
(administrador, agendamiento, admisión, médico, farmacia) y los comandos (`POST`, `PATCH`) **`patients:write`**
(administrador, agendamiento, admisión); si no, 403 `PERMISSION_DENIED`.

- [Registrar paciente](#registrar-paciente)
- [Buscar pacientes](#buscar-pacientes)
- [Ver paciente](#ver-paciente)
- [Actualizar paciente](#actualizar-paciente)
- [Historial del paciente (timeline)](#historial-del-paciente-timeline)
- [Registrar acompañante](#registrar-acompañante)
- [Historial de acompañantes](#historial-de-acompañantes)
- [Modelos](#modelos)

---

## Registrar paciente

```http
POST /api/v1/teams/:teamId/patients
```

Crea el paciente y su evento `patient.registered` en la misma transacción. Si se envía `companion`, queda como
acompañante **#1** en la misma operación.

### Cuerpo

```json
{
  "document": { "type": "CC", "number": "1.000.123.456" },
  "name": {
    "firstName": "Andrés",
    "middleName": null,
    "firstLastName": "Gómez",
    "secondLastName": "Torres"
  },
  "birthDate": "1990-05-20",
  "sex": "H",
  "contact": { "email": "andres@example.com", "phone": "300 123 4567", "address": null },
  "affiliation": { "eps": "Sanitas", "regime": "contributivo" },
  "companion": {
    "relationship": "madre",
    "name": { "firstName": "María", "firstLastName": "Torres" },
    "document": { "type": "CC", "number": "52000111" },
    "phone": "3001112222",
    "email": null
  },
  "requestedBy": "user_2abc…"
}
```

| Campo | Obligatorio | Reglas |
|---|---|---|
| `document.type` | Sí | `CC`, `CE`, `TI`, `RC`, `NIT`, `PA`, `PPT`, `PEP`, `CD`, `SC`, `CN`, `AS`, `MS` |
| `document.number` | Sí | 3-20 letras o dígitos; se guarda sin puntos, espacios ni guiones. `CC`, `TI`, `RC`, `NIT`, `CN`: solo dígitos. **Único por IPS** (tipo + número). |
| `name.firstName`, `name.firstLastName` | Sí | Hasta 60 letras, espacios, apóstrofes o guiones |
| `name.middleName`, `name.secondLastName` | No | Igual que arriba; vacío → `null` |
| `birthDate` | Sí | `YYYY-MM-DD`, fecha real, no futura ni de hace más de 130 años |
| `sex` | Sí | `H` (hombre), `M` (mujer), `I` (indeterminado) |
| `contact.email` | Sí | E-mail válido; se guarda en minúsculas |
| `contact.phone` | No | 7-15 dígitos, opcionalmente con `+`; se ignoran espacios, guiones y paréntesis |
| `contact.address` | No | Hasta 200 caracteres |
| `affiliation.regime` | Sí | `contributivo`, `subsidiado`, `especial`, `particular` |
| `affiliation.eps` | Según régimen | Obligatoria salvo en `particular`, donde debe ir vacía |
| `companion` | No | Ver [acompañante](#registrar-acompañante) |
| `requestedBy` | No | Id de usuario de Clerk que pidió el registro; debe ser miembro de la IPS. Por defecto, quien llama. |

### Respuestas

| Código | Cuándo |
|---|---|
| **201** | Creado; cuerpo: [`PatientView`](#patientview) |
| 400 | `INVALID_VALUE`, `INVALID_BIRTH_DATE`, `INVALID_REQUESTER` o forma inválida |
| 409 | `DOCUMENT_ALREADY_REGISTERED` |

---

## Buscar pacientes

```http
GET /api/v1/teams/:teamId/patients?q=gomez&page=1&pageSize=20
```

| Parámetro | Descripción |
|---|---|
| `q` | Texto libre: número de documento y/o nombres. Ignora tildes y mayúsculas (`pena` encuentra "Peña"); cada palabra debe aparecer. Vacío lista todos. |
| `page` | Desde 1 (por defecto 1) |
| `pageSize` | 1-100 (por defecto 20) |

Orden: primer apellido, primer nombre.

**200 OK**

```json
{
  "items": [ /* PatientView */ ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

---

## Ver paciente

```http
GET /api/v1/teams/:teamId/patients/:patientId
```

**200** con [`PatientView`](#patientview) · **400** si `patientId` no es un UUID · **404** `PATIENT_NOT_FOUND` (no existe o
es de otra IPS).

---

## Actualizar paciente

```http
PATCH /api/v1/teams/:teamId/patients/:patientId
```

```json
{
  "version": 1,
  "contact": { "email": "nuevo@example.com", "phone": null, "address": "Calle 1 # 2-3" },
  "requestedBy": "user_2abc…"
}
```

- **`version`** (obligatorio): la que leyó el cliente. Si el paciente cambió desde entonces → 409.
- Grupos editables: `document`, `name`, `birthDate`, `sex`, `contact`, `affiliation`. Cada grupo enviado **reemplaza
  completo** al actual (mismas reglas que al registrar); los no enviados no cambian.
- Si nada cambia, no se guarda ni se traza nada y la versión se mantiene.
- Cada cambio real sube `version` y registra un evento `patient.updated` con `field`, `from` y `to`.

| Código | Cuándo |
|---|---|
| **200** | [`PatientView`](#patientview) actualizado |
| 400 | Valor inválido o `INVALID_REQUESTER` |
| 404 | `PATIENT_NOT_FOUND` |
| 409 | `PATIENT_VERSION_CONFLICT` o `DOCUMENT_ALREADY_REGISTERED` (nuevo documento ya usado) |

---

## Historial del paciente (timeline)

```http
GET /api/v1/teams/:teamId/patients/:patientId/timeline
```

Todo lo que ha pasado con el paciente, **del más antiguo al más reciente**, leído de la colección `trace_events`
(se ve al instante tras cada cambio).

**200 OK**: lista de [`TimelineEntryView`](#timelineentryview)

```json
[
  {
    "id": "0f710bcd-…",
    "type": "patient.updated",
    "occurredAt": "2026-10-02T07:09:33.596Z",
    "requestedBy": "user_carol",
    "requestedByName": "Carolina Gómez",
    "executedBy": "user_alice",
    "executedByName": "Alicia Gómez",
    "data": {
      "changes": [
        {
          "field": "contact",
          "from": { "email": "andres@example.com", "phone": null, "address": null },
          "to": { "email": "andres@example.com", "phone": "3001234567", "address": null }
        }
      ]
    }
  }
]
```

| `type` | `data` |
|---|---|
| `patient.registered` | Datos completos del paciente al registrarlo |
| `patient.updated` | `{ "changes": [{ "field", "from", "to" }] }` |
| `patient.companion_recorded` | El acompañante y su `number` |
| `appointment.*` | Pasos de sus citas: ver [Agendamiento](06-scheduling.md#historial-del-paciente) |
| `consultation.*` | Consulta iniciada, firmada o con nota aclaratoria, **sin contenido clínico**: ver [Consulta](08-consultation.md#historial-del-paciente) |
| `pharmacy.dispensed` | Unidades entregadas y estado de la fórmula, sin nombres de medicamentos: ver [Farmacia](09-pharmacy.md#historial-del-paciente) |
| `turn.*` | Llegada, llamados (también automáticos, por `system`), atendido o no se presentó: ver [Admisión](07-admission.md#historial-del-paciente) |

`requestedByName` / `executedByName`: nombre del directorio de personal; `"Usuario eliminado"` si fue anonimizado;
`null` si aún no se conoce.

---

## Registrar acompañante

```http
POST /api/v1/teams/:teamId/patients/:patientId/companions
```

Agrega un acompañante al historial del paciente con el **siguiente número** (#1, #2…). Nunca reemplaza a los
anteriores; dos registros simultáneos reciben números distintos.

```json
{
  "relationship": "cuidador",
  "name": { "firstName": "Luis", "firstLastName": "Pérez" },
  "document": { "type": "CC", "number": "79000222" },
  "phone": "3003334444",
  "email": null,
  "requestedBy": "user_2abc…"
}
```

| Campo | Reglas |
|---|---|
| Todos | Opcionales, pero se exige **nombre o teléfono** |
| `relationship` | `madre`, `padre`, `hijo`, `conyuge`, `hermano`, `familiar`, `cuidador`, `otro` |
| `name`, `document`, `phone`, `email` | Mismas reglas que en el paciente |

| Código | Cuándo |
|---|---|
| **201** | [`CompanionView`](#companionview) con su `number` |
| 400 | Sin nombre ni teléfono, valor inválido o `INVALID_REQUESTER` |
| 404 | `PATIENT_NOT_FOUND` |

---

## Historial de acompañantes

```http
GET /api/v1/teams/:teamId/patients/:patientId/companions
```

**200 OK**, del número más alto (más reciente) al más bajo:

```json
{
  "history": [ /* CompanionView #2 */, /* CompanionView #1 */ ]
}
```

---

## Modelos

### PatientView

```json
{
  "id": "125355e5-e6c5-4d3e-8f53-fa80b6c57e33",
  "document": { "type": "CC", "number": "1000123456" },
  "name": { "firstName": "Andrés", "middleName": null, "firstLastName": "Gómez", "secondLastName": "Torres" },
  "fullName": "Andrés Gómez Torres",
  "birthDate": "1990-05-20",
  "sex": "H",
  "contact": { "email": "andres@example.com", "phone": "3001234567", "address": null },
  "affiliation": { "eps": "Sanitas", "regime": "contributivo" },
  "version": 1,
  "registeredAt": "2026-10-02T07:09:33.596Z",
  "updatedAt": "2026-10-02T07:09:33.596Z"
}
```

### TimelineEntryView

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string (UUID) | Id del evento |
| `type` | string | Tipo de evento |
| `occurredAt` | string (ISO) | Cuándo ocurrió |
| `requestedBy` / `executedBy` | string | Ids de usuario de Clerk |
| `requestedByName` / `executedByName` | string \| null | Nombres resueltos al leer |
| `data` | object | Detalle según el tipo |

### CompanionView

```json
{
  "number": 2,
  "relationship": "cuidador",
  "name": { "firstName": "Luis", "middleName": null, "firstLastName": "Pérez", "secondLastName": null },
  "fullName": "Luis Pérez",
  "document": { "type": "CC", "number": "79000222" },
  "phone": "3003334444",
  "email": null,
  "recordedAt": "2026-10-02T07:10:00.000Z",
  "requestedBy": "user_2abc…",
  "requestedByName": "Carolina Gómez",
  "executedBy": "user_2def…",
  "executedByName": "Alicia Gómez"
}
```
