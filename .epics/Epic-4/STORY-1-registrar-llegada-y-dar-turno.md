# Historia 1: Registrar la llegada y dar turno

> Como auxiliar de admisión, quiero registrar la llegada del paciente a su cita de hoy y entregarle un turno para que
> espere a ser llamado en orden.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: agrega una pantalla nueva.

## Contexto

Cuando el paciente llega a la IPS, admisión verifica que tenga cita hoy y le entrega un turno identificado por el
servicio (RTH 4). Esta historia crea ese paso y lo deja en el historial del paciente.

## Entregabilidad

Completa: el turno queda en espera y aparece en la lista de turnos (la lista con acciones llega en la Historia 2).

## Alcance

### Incluye

- Buscar las citas de hoy de un paciente.
- Registrar la llegada y mostrar el turno asignado.
- Evento "llegada" en el historial del paciente.

### No incluye

- Turnos sin cita (consulta prioritaria o urgencias).
- Impresión de tiquete físico.

## Criterios de aceptación

- [ ] **Dado que** el paciente tiene una cita confirmada hoy en Rehabilitación y ya hay 3 turnos RTH, **cuando**
      registro su llegada, **entonces** recibe el turno "RTH 4" en espera.
- [ ] **Dado que** la cita es de mañana, **cuando** intento registrar la llegada, **entonces** el sistema indica que la
      cita no es de hoy.
- [ ] **Dado que** la cita está cancelada, **cuando** intento registrar la llegada, **entonces** se rechaza.
- [ ] **Dado que** ya registré la llegada de esa cita, **cuando** lo intento de nuevo (o dos personas lo hacen a la
      vez), **entonces** el paciente conserva un solo turno.
- [ ] **Dado que** registré la llegada, **cuando** abro el historial del paciente, **entonces** aparece con el turno,
      el servicio y el lugar.
- [ ] **Dado que** no tengo el rol de admisión ni soy administrador, **cuando** intento registrar una llegada,
      **entonces** se me niega.

## Estados de error y vacíos

- Paciente sin citas hoy: "Este paciente no tiene citas para hoy".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Numeración | Contador por IPS, día y código, tomado en la misma transacción. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Turno | Uno por cita. |
| Llegada | Solo citas de hoy, agendadas o confirmadas. |

## Áreas que cambia

La pantalla de admisión y el historial del paciente.

## Áreas que no debe cambiar

Las acciones sobre el turno (Historia 2) y la pantalla de sala (Historia 3).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Agendar dos citas de hoy en Rehabilitación.
2. Registrar la llegada de ambas y comprobar RTH 1 y RTH 2.
3. Intentar registrar otra vez la primera.
4. Intentar con una cita de mañana.

## Evidencia

Commit `0bfbc72`. Pruebas: `api/test/admission.e2e-spec.ts`.
