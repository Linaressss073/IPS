# Historia 5: Salida FEFO con trazabilidad de lotes

> Como farmacéutico, quiero que cada entrega descuente del inventario empezando por el lote que vence primero para
> no desperdiciar medicamentos y saber qué lote recibió cada paciente.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Con inventario y dispensación separados, el stock no reflejaba las entregas. Esta historia los une: al entregar se
elige el producto, el sistema descuenta por FEFO, registra la salida en el kárdex y guarda en la entrega los lotes que
salieron, todo o nada.

## Entregabilidad

Completa. Incluye la corrección que permite entregar dos líneas del mismo producto en una sola dispensación.

## Alcance

### Incluye

- Elegir el producto del inventario para cada línea entregada.
- Descuento FEFO, ignorando lotes vencidos.
- Lotes que salieron, visibles en cada línea de la entrega.
- Salida en el kárdex con referencia a la consulta.
- Rechazo sin existencias, con producto inactivo o si otra entrega tocó el mismo producto a la vez.
- Varias líneas del mismo producto en una entrega.

### No incluye

- Elegir manualmente el lote.
- Reservar stock al firmar la fórmula.

## Criterios de aceptación

- [ ] **Dado que** el producto tiene el lote SOON (8 u, vence en 15 días) y LATE (20 u, vence en un año), **cuando**
      entrego 10, **entonces** salen 8 de SOON y 2 de LATE, y la entrega muestra ambos lotes.
- [ ] **Dado que** el único lote con unidades está vencido, **cuando** entrego, **entonces** el sistema indica que no
      hay existencias suficientes y nada cambia.
- [ ] **Dado que** el producto está inactivo, **cuando** lo elijo, **entonces** se rechaza.
- [ ] **Dado que** otra entrega descontó el mismo producto al mismo tiempo, **cuando** guardo, **entonces** se me avisa
      que el stock cambió y ni la entrega ni el stock se modifican.
- [ ] **Dado que** dos medicamentos de la fórmula salen del mismo producto, **cuando** los entrego juntos, **entonces**
      la entrega se registra y el stock baja por la suma de ambos.
- [ ] **Dado que** entregué, **cuando** veo el kárdex del producto, **entonces** aparece la salida con referencia a la
      consulta y quién la hizo.

## Estados de error y vacíos

- Producto sin disponible: se muestra en cero y no se puede elegir para entregar.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Varias salidas en una operación | Todos los cambios de una misma entrega quedan en una sola versión del producto (corrección `b2acae2`). |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Salida | FEFO; vencidos no cuentan. |
| Atomicidad | Entrega, stock y kárdex en una transacción. |
| Trazabilidad | Lotes guardados por línea. |

## Requisitos de consistencia

La entrega sigue funcionando como en la Historia 2 (parcial, completa, nota); solo agrega el producto y los lotes.

## Áreas que cambia

La entrega de la fórmula y el inventario (disponible y kárdex).

## Áreas que no debe cambiar

Las recepciones y ajustes (Historia 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Hay una prueba automática de la entrega de dos ítems del mismo producto.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Recibir dos lotes con vencimientos distintos.
2. Entregar una cantidad mayor al primer lote y revisar los lotes de la entrega.
3. Entregar dos líneas del mismo producto juntas.
4. Revisar el kárdex del producto.

## Evidencia

Commits `f9e5210`, `b2acae2`. Pruebas: `api/test/pharmacy.e2e-spec.ts`, `product.entity.spec.ts`.
