# Historia 4: Inventario por lotes y kárdex

> Como farmacéutico, quiero registrar los productos, recibir lotes con su vencimiento y ajustar existencias para
> saber en todo momento qué tengo, qué vence pronto y qué debo pedir.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: pantalla nueva.

## Contexto

Para dispensar con control hay que saber qué hay en la farmacia, de qué lote y hasta cuándo sirve. Esta historia crea
el catálogo de productos, la recepción de lotes, los ajustes con motivo, las alertas y el kárdex de cada producto.

## Entregabilidad

Completa: el inventario funciona por sí solo; la dispensación lo usa en la Historia 5.

## Alcance

### Incluye

- Crear producto (nombre, presentación, stock mínimo); cambiar mínimo y activarlo o desactivarlo.
- Recibir un lote (número, vencimiento, cantidad, proveedor opcional); recibirlo de nuevo suma unidades.
- Ajustes positivos o negativos con motivo.
- Disponible (solo lotes no vencidos), lotes con su estado y alertas.
- Kárdex por producto, el movimiento más reciente primero.

### No incluye

- Órdenes de compra a proveedores.
- Varias bodegas.
- Precios o costos.

## Criterios de aceptación

- [ ] **Dado que** creo "Amoxicilina 500 mg" en cápsula, **cuando** creo otro igual con distintas tildes o
      mayúsculas, **entonces** el sistema indica que ya existe.
- [ ] **Dado que** recibo el lote L2309 con vencimiento 2027-03-31 y 20 unidades, **cuando** guardo, **entonces** el
      disponible sube en 20 y el kárdex muestra una entrada.
- [ ] **Dado que** el lote L2309 existe, **cuando** lo recibo con otro vencimiento, **entonces** se rechaza.
- [ ] **Dado que** intento recibir un lote ya vencido, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** el lote tiene 5 unidades, **cuando** ajusto -6, **entonces** el sistema indica que no puede quedar
      negativo.
- [ ] **Dado que** un lote vence en menos de 30 días, **cuando** veo el producto, **entonces** tiene la alerta "por
      vencer".
- [ ] **Dado que** el disponible es igual o menor al mínimo, **cuando** veo el inventario, **entonces** el producto
      tiene la alerta "stock bajo".
- [ ] **Dado que** un lote ya venció, **cuando** veo el producto, **entonces** sus unidades no cuentan en el disponible
      y aparece la alerta "vencido".

## Estados de error y vacíos

- Sin productos: invita a crear el primero.
- Producto sin lotes: disponible 0 y alerta de stock bajo si tiene mínimo.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Número de lote | 1 a 30 letras, dígitos o guiones; se guarda en mayúsculas. |
| Motivo de ajuste | 3 a 200 caracteres. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Inventario | Productos con lotes y vencimiento. |
| Kárdex | Solo inserción. |
| Alertas | Stock bajo, por vencer (30 días), vencido. |

## Áreas que cambia

La pantalla de Inventario.

## Áreas que no debe cambiar

La dispensación (Historia 2) hasta la Historia 5.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Crear un producto con mínimo 10.
2. Recibir un lote que vence en 15 días y otro en un año.
3. Revisar alertas y disponible.
4. Hacer un ajuste negativo con motivo y revisar el kárdex.

## Evidencia

Commit `f9e5210`. Pruebas: `api/test/pharmacy.e2e-spec.ts`, `product.entity.spec.ts`.
