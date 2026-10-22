# Historia 2: Agendas de los médicos con cupos

> Como auxiliar de agendamiento, quiero abrir la agenda de un médico dividida en cupos para tener horas concretas que
> ofrecer a los pacientes.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Un médico atiende un servicio en un lugar durante un bloque de tiempo, dividido en cupos iguales. Esta historia
permite abrir esos bloques sin cruces, ver de antemano los cupos que saldrán y entender exactamente qué está mal en un
horario inválido.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Abrir agenda: médico, servicio, ubicación, fecha, hora de inicio y fin, duración del cupo.
- Vista previa de los cupos antes de guardar.
- Errores específicos de horario (con sugerencia de hora de fin si los cupos no son completos).
- Vista del día con las agendas y sus cupos (libres u ocupados), filtrable por médico y servicio.
- Eliminar una agenda sin citas activas.

### No incluye

- Agendas recurrentes (todos los lunes…).
- Bloquear cupos sueltos.

## Criterios de aceptación

- [ ] **Dado que** elijo de 07:00 a 08:00 con cupos de 20 minutos, **cuando** veo la vista previa, **entonces**
      aparecen 07:00, 07:20 y 07:40.
- [ ] **Dado que** elijo de 07:00 a 08:10 con cupos de 20 minutos, **cuando** guardo, **entonces** el sistema indica
      que los cupos no son completos y sugiere terminar a las 08:00 o a las 08:20.
- [ ] **Dado que** la hora de fin es anterior a la de inicio, **cuando** guardo, **entonces** se rechaza con ese
      motivo.
- [ ] **Dado que** la fecha ya pasó, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** el médico o el consultorio ya tienen una agenda que se cruza, **cuando** guardo, **entonces** el
      sistema indica el cruce.
- [ ] **Dado que** la persona elegida no tiene rol médico, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** una agenda tiene citas activas, **cuando** intento eliminarla, **entonces** el sistema no lo
      permite; sin citas activas, se elimina.

## Estados de error y vacíos

- Día sin agendas: "No hay agendas para este día".
- Sin médicos: aviso de que nadie tiene rol médico.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Duración del cupo | De 5 a 240 minutos. |
| Profesionales | Solo personas con rol médico en la IPS. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Agenda | Sin cruces de médico ni de ubicación. |
| Hora | Colombia. |

## Requisitos de consistencia

La vista del día usa los servicios y ubicaciones de la Historia 1 con sus mismos nombres.

## Áreas que cambia

La pantalla de agenda.

## Áreas que no debe cambiar

La asignación de citas (Historia 3).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Abrir una agenda de 07:00 a 08:00 con cupos de 20 minutos y revisar la vista previa.
2. Intentar 07:00 a 08:10 y leer la sugerencia.
3. Abrir una segunda agenda que se cruce en el mismo consultorio.
4. Eliminar una agenda sin citas.

## Evidencia

Commits `0da51cb`, `3ad22b8`. Pruebas: `api/test/scheduling.e2e-spec.ts`, unitarios de `agenda.entity`.
