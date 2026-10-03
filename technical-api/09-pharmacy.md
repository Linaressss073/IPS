# Farmacia

[← Índice](README.md)

Dispensación de fórmulas médicas **firmadas**, completa o por partes, y turnos de farmacia en la pantalla de sala.
Rutas bajo `/api/v1/teams/:teamId/pharmacy/prescriptions`. Permiso: **`pharmacy:dispense`** (rol Farmacia).

Farmacia ve **solo la fórmula** (medicamentos, dosis, vía, frecuencia, cantidades) y quién la firmó: nunca la nota
clínica, los signos vitales ni los diagnósticos.

```
pendiente ──entrega parcial──► parcial ──entrega del resto──► completa
```

## Endpoints

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `?date=&patientId=&status=` | 200 `PharmacyPrescriptionView[]` (por defecto, fórmulas de hoy; con `patientId`, de cualquier día) |
| GET | `/:consultationId` | 200 `PharmacyPrescriptionView` · 404 `PRESCRIPTION_NOT_FOUND` si no está firmada o no tiene medicamentos |
| POST | `/:consultationId/deliveries` | 200 `PharmacyPrescriptionView` |
| POST | `/:consultationId/turn` | 201 `TurnView` (turno `FAR n`) |

`status`: `pendiente`, `parcial`, `completa`.

### Entregar

```json
{
  "version": 0,
  "lines": [
    { "index": 0, "quantity": 15 },
    { "index": 1, "quantity": 4 }
  ],
  "note": "Sin existencias de loratadina"
}
```

- `version`: la que leyó el cliente (**0** antes de la primera entrega). Si alguien entregó antes → 409
  `DISPENSATION_VERSION_CONFLICT`.
- `index`: posición del medicamento en la fórmula. Cantidades enteras desde 1 y **a lo sumo lo pendiente** (400
  `OVER_DELIVERY`). Sin unidades, índice desconocido o repetido → 400 `INVALID_VALUE`.
- Fórmula ya completa → 409 `NOTHING_PENDING`.

### Dar turno

`{ "windowId": "<id de una ubicación activa, p. ej. Farmacia 1>" }`. Crea el turno `FAR 1`, `FAR 2`… del día en esa
ventanilla; se llama desde [Turnos](07-admission.md) y sale en la pantalla de sala. Uno por fórmula y día (409
`ALREADY_CHECKED_IN`); no si ya está completa (409 `ALREADY_DISPENSED`); ventanilla desconocida o inactiva → 404
`WINDOW_NOT_FOUND`. El `TurnView` trae `origin: { "kind": "farmacia", "consultationId": "…" }`.

## PharmacyPrescriptionView

```json
{
  "consultationId": "c41a…",
  "patient": { "id": "1253…", "fullName": "Andrés Gómez", "document": { "type": "CC", "number": "1000123456" } },
  "physician": { "userId": "user_2abc…", "displayName": "Carolina Gómez" },
  "date": "2026-10-05",
  "signedAt": "2026-10-05T12:40:00.000Z",
  "status": "parcial",
  "items": [
    {
      "index": 1,
      "medication": "Loratadina 10 mg",
      "presentation": "Tableta",
      "dose": "1 tableta",
      "route": "oral",
      "frequency": "Cada 24 horas",
      "durationDays": 10,
      "instructions": "",
      "prescribed": 10,
      "delivered": 4,
      "pending": 6
    }
  ],
  "deliveries": [
    { "at": "…", "by": "user_…", "byName": "…", "lines": [{ "index": 1, "medication": "Loratadina 10 mg", "quantity": 4 }], "note": "…" }
  ],
  "version": 1
}
```

## Historial del paciente

`pharmacy.dispensed` con `{ consultationId, status, units }`: **unidades, sin nombres de medicamentos** (el historial
lo ven roles que no deben inferir diagnósticos). Los turnos de farmacia aparecen como `turn.*` con `consultationId`.

Colección: `pharmacy_dispensations` (`_id` = id de la consulta).
