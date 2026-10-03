# Farmacia

[← Índice](README.md)

Dispensación de fórmulas médicas **firmadas**, completa o por partes, con **inventario por lotes y vencimientos**, y turnos de farmacia en la pantalla de sala.
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
    { "index": 0, "quantity": 15, "productId": "<producto del inventario>" },
    { "index": 1, "quantity": 4, "productId": "<producto del inventario>" }
  ],
  "note": "Sin existencias de loratadina"
}
```

- `version`: la que leyó el cliente (**0** antes de la primera entrega). Si alguien entregó antes → 409
  `DISPENSATION_VERSION_CONFLICT`.
- `index`: posición del medicamento en la fórmula. Cantidades enteras desde 1 y **a lo sumo lo pendiente** (400
  `OVER_DELIVERY`). Sin unidades, índice desconocido o repetido → 400 `INVALID_VALUE`.
- Fórmula ya completa → 409 `NOTHING_PENDING`.
- `productId`: de qué producto del [inventario](#inventario) salen las unidades. Se descuentan por **FEFO** (primero el
  lote que vence primero; los vencidos no cuentan). Sin existencias → 409 `INSUFFICIENT_STOCK`; producto inactivo → 400
  `INACTIVE_PRODUCT`. La entrega, el stock y el kárdex se guardan en **una transacción**: si otra entrega tocó el mismo
  producto a la vez → 409 `STOCK_CHANGED` y no cambia nada.
- Cada línea entregada guarda **los lotes** que salieron (trazabilidad ante una alerta sanitaria).

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
    {
      "at": "…", "by": "user_…", "byName": "…", "note": "…",
      "lines": [
        {
          "index": 1, "medication": "Loratadina 10 mg", "quantity": 4, "productId": "…",
          "lots": [{ "lotNumber": "L2309", "expiresOn": "2027-03-31", "quantity": 4 }]
        }
      ]
    }
  ],
  "version": 1
}
```

## Historial del paciente

`pharmacy.dispensed` con `{ consultationId, status, units }`: **unidades, sin nombres de medicamentos** (el historial
lo ven roles que no deben inferir diagnósticos). Los turnos de farmacia aparecen como `turn.*` con `consultationId`.

## Inventario

Rutas bajo `/api/v1/teams/:teamId/pharmacy/products`, permiso `pharmacy:dispense`.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/` | | 200 `ProductView[]` |
| POST | `/` | `{ name, presentation, minStock }` | 201 `ProductView` · 409 `PRODUCT_TAKEN` (mismo nombre y presentación, sin importar tildes ni mayúsculas) |
| GET | `/:productId` | | 200 `ProductView` · 404 `PRODUCT_NOT_FOUND` |
| PATCH | `/:productId` | `{ minStock?, active? }` | 200 `ProductView` |
| POST | `/:productId/lots` | `{ lotNumber, expiresOn, quantity, supplier? }` | 201 `ProductView` |
| POST | `/:productId/adjustments` | `{ lotNumber, quantity, reason }` | 201 `ProductView` |
| GET | `/:productId/movements` | | 200 `MovementView[]` (kárdex, más reciente primero) |

- **Recepción** (`entrada`): `lotNumber` de 1 a 30 letras, dígitos o `-` (se guarda en mayúsculas). Un lote vencido →
  400 `EXPIRED_LOT`. Recibir de nuevo un lote suma unidades; con otro vencimiento → 409 `LOT_EXPIRY_MISMATCH`.
- **Ajuste** (`ajuste`): `quantity` con signo (negativo para dar de baja), `reason` de 3 a 200 caracteres. Nunca deja un
  lote negativo (409 `NEGATIVE_STOCK`); lote desconocido → 404 `LOT_NOT_FOUND`.
- **Salida** (`salida`): solo desde una [entrega](#entregar), con referencia a la consulta.

### ProductView

```json
{
  "id": "…",
  "name": "Amoxicilina 500 mg",
  "presentation": "Cápsula",
  "label": "Amoxicilina 500 mg (Cápsula)",
  "minStock": 10,
  "active": true,
  "available": 28,
  "expired": 0,
  "lots": [
    { "lotNumber": "SOON", "expiresOn": "2026-10-15", "quantity": 8, "status": "por_vencer" },
    { "lotNumber": "LATE", "expiresOn": "2027-11-08", "quantity": 20, "status": "vigente" }
  ],
  "alerts": ["por_vencer"],
  "version": 3
}
```

`available` solo cuenta lotes no vencidos (hora de Colombia). Alertas: `stock_bajo` (activo y `available ≤ minStock`),
`por_vencer` (algún lote vence en los próximos 30 días) y `vencido` (unidades vencidas aún en stock: darlas de baja).

### MovementView

`{ id, type: "entrada" | "salida" | "ajuste", lotNumber, quantity (con signo), reference, at, by, byName }`, con
`reference` = `{ kind: "recepcion", supplier }` | `{ kind: "dispensacion", consultationId }` | `{ kind: "ajuste", reason }`.

Colecciones: `pharmacy_dispensations` (`_id` = id de la consulta), `pharmacy_products` (lotes embebidos, bloqueo
optimista por `version`) y `pharmacy_movements` (kárdex, solo inserción).
