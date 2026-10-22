# Épica 6: Farmacia: dispensación e inventario

## Objetivo

Que la farmacia de la IPS entregue los medicamentos de las fórmulas firmadas, completas o por partes, descontándolos
de un inventario por lotes con salida FEFO (primero lo que vence primero) y un kárdex de cada movimiento. Cierra el
recorrido de la consulta externa y permite rastrear qué lote recibió cada paciente ante una alerta sanitaria.

**Estado:** implementada (commits `a00150c` y `f9e5210` del 3 de octubre, corrección `b2acae2` del 20 de octubre de 2026).

## Documentos de referencia

- `api/README.md` (contexto `pharmacy`).
- `technical-api/09-pharmacy.md`.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Qué ve farmacia | Solo la fórmula y quién la firmó; nunca nota clínica, signos vitales ni diagnósticos. |
| Estados de la dispensación | pendiente → parcial → completa; nunca se entrega más de lo pendiente. |
| Inventario | Productos (nombre + presentación únicos) con lotes embebidos; cada lote con número y vencimiento. |
| Salida | FEFO; los lotes vencidos no cuentan como disponibles. |
| Atomicidad | Entrega, descuento de stock y kárdex en una sola transacción; si otra entrega tocó el mismo producto, no cambia nada y se avisa. |
| Kárdex | Solo inserción: entrada (recepción), salida (dispensación) y ajuste (con motivo). |
| Trazabilidad | Cada línea entregada guarda los lotes que salieron. El historial compartido registra unidades, sin nombres de medicamentos. |
| Turnos | `FAR n` por día y ventanilla, en la misma pantalla de sala de la Épica 4. |
| Alertas | Stock bajo (≤ mínimo), por vencer (≤ 30 días) y vencido (unidades vencidas aún en stock). |

## Orden de las historias

### Historia 1: Fórmulas firmadas para dispensar

**Prioridad**: farmacia necesita ver qué entregar antes de entregarlo.
Farmacia ve las fórmulas firmadas del día (o de un paciente) con lo formulado, lo entregado y lo pendiente.
**Dependencias**: Épica 5.

### Historia 2: Dispensación total o parcial

**Prioridad**: es el valor central de la épica.
Farmacia registra entregas completas o parciales con nota; lo que falta queda pendiente para otra entrega.
**Dependencias**: Historia 1.

### Historia 3: Turnos de farmacia en la pantalla de sala

**Prioridad**: ordena la fila de la farmacia con el mismo mecanismo de la sala.
Farmacia da un turno FAR n a una fórmula en una ventanilla y lo llama desde Turnos.
**Dependencias**: Historia 1, Épica 4.

### Historia 4: Inventario por lotes y kárdex

**Prioridad**: no se puede descontar stock sin inventario.
Productos, recepción de lotes con vencimiento, ajustes con motivo, alertas y kárdex por producto.
**Dependencias**: Épica 1.

### Historia 5: Salida FEFO con trazabilidad de lotes

**Prioridad**: une dispensación e inventario.
Cada entrega descuenta por FEFO del producto elegido, guarda los lotes que salieron y rechaza entregas sin stock o
simultáneas; incluye entregar dos ítems del mismo producto en una sola dispensación.
**Dependencias**: Historias 2 y 4.

## Contexto compartido para el detalle de historias

- **API:** `api/src/contexts/pharmacy/` (`dispensation.entity.ts`, `product.entity.ts`, `pharmacy.commands.ts`,
  `inventory.commands.ts`, `pharmacy.controller.ts`, `inventory.controller.ts`), y el turno FAR que crea admisión
  (`api/src/contexts/admission/`).
- **Frontend:** `app/dashboard/[teamId]/pharmacy`, `app/dashboard/[teamId]/pharmacy/inventory`, `lib/api/pharmacy.ts`.
- **Pruebas:** `api/test/pharmacy.e2e-spec.ts`, `product.entity.spec.ts` y unitarios del contexto `pharmacy`.
