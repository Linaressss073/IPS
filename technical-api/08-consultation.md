# Consulta médica (historia clínica)

[← Índice](README.md)

La historia clínica de cada cita: la escribe y la **firma su médico**. Rutas bajo
`/api/v1/teams/:teamId/consultations`.

| Permiso | Quién lo tiene |
|---|---|
| `clinical:read` | Médico |
| `clinical:write` | Médico (y solo el **médico de la cita** escribe, firma o agrega notas: si no, 403 `NOT_THE_TREATING_PHYSICIAN`) |

Ni el administrador, ni admisión, ni agendamiento, ni farmacia leen notas clínicas. Otro médico de la IPS **puede
leerla** (continuidad de la atención) pero no modificarla.

```
iniciar ──► en_curso (borrador; se guarda cuantas veces quiera) ──firmar──► firmada (inmodificable)
                                                                              └──► notas aclaratorias
```

## Endpoints

| Método | Ruta | Permiso | Respuesta |
|---|---|---|---|
| POST | `/consultations` | `clinical:write` | 200 `ConsultationView` (la nueva, o la que ya existía para la cita) |
| GET | `/consultations?patientId=` · `?appointmentId=` | `clinical:read` | 200 `ConsultationView[]` (más reciente primero) |
| GET | `/consultations/:id` | `clinical:read` | 200 `ConsultationView` |
| PATCH | `/consultations/:id` | `clinical:write` | 200 (borrador) |
| POST | `/consultations/:id/sign` | `clinical:write` | 200 |
| POST | `/consultations/:id/addenda` | `clinical:write` | 200 |

### Iniciar

```json
{ "appointmentId": "9b7e…" }
```

La cita debe ser del médico que llama, no estar cancelada y ser de hoy o anterior (409 `APPOINTMENT_NOT_ATTENDABLE`).
Una consulta por cita (índice único): iniciarla de nuevo devuelve la misma.

### Guardar borrador

`version` obligatorio (409 `CONSULTATION_VERSION_CONFLICT` si cambió). Cada grupo enviado reemplaza al anterior:

```json
{
  "version": 1,
  "note": {
    "reason": "Fiebre y tos",
    "currentIllness": "Tres días de fiebre de hasta 38.5 °C y tos seca.",
    "physicalExam": "Faringe eritematosa, sin exudado.",
    "plan": "Manejo sintomático."
  },
  "vitals": [
    { "name": "temperatura", "value": 38.2 },
    { "name": "peso", "value": 70 },
    { "name": "talla", "value": 175 }
  ],
  "diagnoses": [{ "code": "J06.9", "description": "Infección aguda de las vías respiratorias superiores", "principal": true }],
  "prescription": [
    {
      "medication": "Acetaminofén 500 mg",
      "presentation": "Tableta",
      "dose": "1 tableta",
      "route": "oral",
      "frequency": "Cada 8 horas",
      "durationDays": 5,
      "quantity": 15,
      "instructions": "Después de las comidas"
    }
  ]
}
```

| Campo | Reglas (400 `INVALID_VALUE`) |
|---|---|
| `note.*` | Texto; el motivo hasta 1000 caracteres, los demás hasta 4000 |
| `vitals` | Solo lo medido, cada signo una vez y en rango: presión sistólica 50-260 y diastólica 30-160 mmHg, frecuencia cardiaca 20-250 lpm, respiratoria 5-80 rpm, temperatura 30-45 °C (1 decimal), saturación 50-100 %, peso 0.3-400 kg, talla 20-250 cm |
| `diagnoses` | Código CIE-10 (`J06.9`, `I10`, `R51`), sin repetir, máximo 10, **a lo sumo uno principal** |
| `prescription` | Máximo 20 ítems; `route`: `oral`, `sublingual`, `intravenosa`, `intramuscular`, `subcutanea`, `topica`, `inhalada`, `oftalmica`, `otica`, `nasal`, `rectal`, `vaginal`, `transdermica`; `durationDays` 1-365; `quantity` 1-1000 |

### Firmar

`{ "version": 2 }`. Exige motivo de consulta y un diagnóstico principal (400 `CONSULTATION_INCOMPLETE`, el mensaje dice
qué falta). Firmada no cambia más: `PATCH` → 409 `CONSULTATION_SIGNED`.

### Nota aclaratoria

`{ "version": 3, "text": "Prueba rápida de influenza negativa." }`. Solo en consultas firmadas (409
`CONSULTATION_NOT_SIGNED` si no); se agrega con fecha y autor, nunca se borra.

## ConsultationView

```json
{
  "id": "c41a…",
  "status": "firmada",
  "signature": { "signed": true, "at": "2026-10-05T12:40:00.000Z" },
  "patient": { "id": "1253…", "fullName": "Andrés Gómez", "document": { "type": "CC", "number": "1000123456" } },
  "physician": { "userId": "user_2abc…", "displayName": "Carolina Gómez" },
  "appointment": { "id": "9b7e…", "date": "2026-10-05", "time": "07:20" },
  "service": { "id": "…", "code": "MG", "name": "Medicina general" },
  "location": { "id": "…", "label": "Consultorio 301" },
  "note": { "reason": "…", "currentIllness": "…", "physicalExam": "…", "plan": "…" },
  "vitals": [{ "name": "temperatura", "value": 38.2, "unit": "°C" }],
  "bmi": [22.9],
  "diagnoses": [{ "code": "J06.9", "description": "…", "principal": true }],
  "prescription": [ /* … */ ],
  "addenda": [{ "text": "…", "writtenBy": "user_2abc…", "writtenByName": "Carolina Gómez", "writtenAt": "…" }],
  "startedAt": "…",
  "updatedAt": "…",
  "version": 4
}
```

`signature` es `{ "signed": false }` mientras está en curso. `bmi` trae el IMC si hay peso y talla (lista vacía si no).

## Historial del paciente

El historial lo ven todos los roles que leen pacientes, así que **no lleva contenido clínico**: solo qué consulta, de
qué cita, servicio y lugar.

| `type` | Cuándo |
|---|---|
| `consultation.started` | Se abrió la consulta |
| `consultation.signed` | Se firmó |
| `consultation.addendum_added` | Se agregó una nota aclaratoria |

Colección: `consultations` (índice único por `appointment.id`).
