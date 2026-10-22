# Historia 2: Dispensación total o parcial

> Como farmacéutico, quiero registrar lo que entrego de cada fórmula, aunque sea por partes, para que lo que falta
> quede pendiente y nunca se entregue de más.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

No siempre hay existencias de todo: a veces se entrega una parte y el resto otro día. Esta historia registra cada
entrega con sus cantidades y una nota, lleva la cuenta de lo pendiente y evita que dos farmacéuticos entreguen la
misma fórmula a la vez.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Entregar una o varias líneas de la fórmula con cantidad y nota opcional.
- Estado de la fórmula: pendiente → parcial → completa.
- Lista de entregas con fecha, quién entregó y nota.
- Evento en el historial del paciente con las unidades entregadas.

### No incluye

- Descuento de inventario (Historia 5).
- Devoluciones de medicamentos.

## Criterios de aceptación

- [ ] **Dado que** la fórmula pide 10 tabletas de loratadina, **cuando** entrego 4 con la nota "Sin existencias",
      **entonces** la fórmula queda "parcial" con 6 pendientes.
- [ ] **Dado que** quedan 6 pendientes, **cuando** intento entregar 7, **entonces** el sistema indica que supera lo
      pendiente.
- [ ] **Dado que** entrego todo lo pendiente, **cuando** guardo, **entonces** la fórmula queda "completa".
- [ ] **Dado que** la fórmula está completa, **cuando** intento otra entrega, **entonces** el sistema indica que no hay
      nada pendiente.
- [ ] **Dado que** otro farmacéutico entregó la misma fórmula mientras yo la tenía abierta, **cuando** guardo,
      **entonces** se me avisa del conflicto y no se registra una entrega duplicada.
- [ ] **Dado que** entregué, **cuando** veo el historial del paciente, **entonces** aparecen las unidades, sin nombres
      de medicamentos.

## Estados de error y vacíos

- Sin líneas seleccionadas: el botón de entregar queda deshabilitado.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Cantidades | Enteras desde 1; una línea no se repite en la misma entrega. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Estados | pendiente → parcial → completa. |
| Historial compartido | Unidades, sin nombres de medicamentos. |

## Requisitos de consistencia

La entrega se hace desde el detalle de la fórmula de la Historia 1.

## Áreas que cambia

El detalle de la fórmula y el historial del paciente.

## Áreas que no debe cambiar

El inventario (Historia 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Entregar parte de una fórmula con nota.
2. Intentar entregar más de lo pendiente.
3. Completar la entrega.
4. Revisar el historial del paciente.

## Evidencia

Commit `a00150c`. Pruebas: `api/test/pharmacy.e2e-spec.ts`, unitarios de `dispensation.entity`.
