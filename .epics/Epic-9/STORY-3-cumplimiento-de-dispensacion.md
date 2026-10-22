# Historia 3: Cumplimiento de la dispensación e inventario

> Como administrador o administrador médico de la IPS, quiero saber qué porcentaje de fórmulas se entrega completo y qué productos están en
> alerta para evitar que los pacientes salgan sin sus medicamentos.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

La farmacia ya registra cada entrega (completa o parcial) y el inventario calcula alertas de stock bajo, por vencer y
vencido. Esta historia resume esos datos para la dirección.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Porcentaje de fórmulas firmadas en el mes entregadas completas en la primera entrega.
- Número de fórmulas con pendientes al cierre del mes.
- Número de productos con cada alerta (stock bajo, por vencer, vencido), con el nombre de cada producto.

### No incluye

- Valor económico del inventario.
- Medicamentos por paciente.

## Criterios de aceptación

- [ ] **Dado que** en el mes se firmaron 10 fórmulas y 8 se entregaron completas en la primera entrega, **cuando** veo
      el indicador, **entonces** muestra 80 %.
- [ ] **Dado que** 2 fórmulas siguen con pendientes, **cuando** veo el indicador, **entonces** muestra 2 fórmulas con
      pendientes.
- [ ] **Dado que** hay 3 productos con stock bajo, **cuando** veo el inventario en el indicador, **entonces** aparecen
      los 3 por nombre.
- [ ] **Dado que** abro el indicador, **cuando** lo reviso, **entonces** no aparece ningún nombre de paciente.

## Estados de error y vacíos

- Sin fórmulas en el mes: "Sin fórmulas en este periodo".
- Sin alertas: "Inventario sin alertas".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Fórmulas sin medicamentos | No cuentan. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Datos clínicos | Solo cifras agregadas; productos por nombre, nunca pacientes. |

## Requisitos de consistencia

Misma presentación y filtros que las Historias 1 y 2.

## Áreas que cambia

La sección de indicadores.

## Áreas que no debe cambiar

Farmacia e inventario.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los cálculos están cubiertos por pruebas.

## Pasos de verificación

1. Firmar varias fórmulas; entregar unas completas y otras parciales.
2. Dejar un producto por debajo del mínimo.
3. Comprobar los porcentajes y las alertas.
