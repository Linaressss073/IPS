# Historia 2: Inasistencia y tiempos de espera en sala

> Como administrador o administrador médico de la IPS, quiero conocer el porcentaje de inasistencia y cuánto esperan los pacientes en sala para
> mejorar el flujo de la consulta externa.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

La admisión ya registra la llegada, cada llamado y el cierre de cada turno, incluidos los "no se presentó". Esta
historia agrega esos datos por servicio y mes.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Inasistencia: citas del periodo que no se admitieron o cuyo turno cerró como "no se presentó", sobre el total de
  citas no canceladas.
- Espera en sala: promedio de minutos entre la llegada y el primer llamado.
- Filtro por servicio y mes.

### No incluye

- Duración de la consulta.
- Datos por médico (ver preguntas abiertas).

## Criterios de aceptación

- [ ] **Dado que** en el mes hubo 10 citas no canceladas y 2 terminaron en "no se presentó", **cuando** veo el
      indicador, **entonces** muestra 20 % de inasistencia.
- [ ] **Dado que** una cita confirmada nunca se admitió y su día ya pasó, **cuando** se calcula, **entonces** cuenta
      como inasistencia.
- [ ] **Dado que** dos pacientes esperaron 10 y 20 minutos hasta su primer llamado, **cuando** veo el indicador,
      **entonces** muestra 15 minutos de espera promedio.
- [ ] **Dado que** un turno se marcó atendido sin llamado previo, **cuando** se calcula la espera, **entonces** se usa
      la hora en que se atendió.
- [ ] **Dado que** el periodo no tiene turnos, **cuando** lo consulto, **entonces** dice "Sin datos".

## Estados de error y vacíos

- Sin datos: "Sin turnos en este periodo".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Turnos de farmacia | Excluidos de estos indicadores. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Periodo | Mes en hora de Colombia, filtro por servicio. |

## Requisitos de consistencia

Misma presentación y filtros que el indicador de oportunidad (Historia 1).

## Áreas que cambia

La sección de indicadores.

## Áreas que no debe cambiar

Admisión y turnos.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los cálculos están cubiertos por pruebas.

## Pasos de verificación

1. Crear citas de un día pasado: admitir y atender unas, cerrar otra como "no se presentó" y dejar otra sin admitir.
2. Comprobar el porcentaje de inasistencia y la espera promedio.

## Preguntas abiertas

- ¿Se quieren los indicadores por médico? Puede ser sensible para el personal.
