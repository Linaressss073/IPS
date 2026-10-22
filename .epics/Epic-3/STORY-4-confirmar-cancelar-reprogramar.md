# Historia 4: Confirmar, cancelar y reprogramar

> Como auxiliar de agendamiento, quiero confirmar, cancelar o mover una cita para que la agenda refleje lo que el
> paciente realmente hará y los cupos liberados se puedan volver a ofrecer.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Entre el agendamiento y la atención la cita cambia: el paciente confirma, no puede venir o necesita otra hora. Esta
historia agrega esos tres pasos, con su motivo cuando aplica y sin pisar cambios de otra persona.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Confirmar una cita agendada.
- Cancelar una cita agendada o confirmada con motivo (3 a 200 caracteres), liberando el cupo.
- Reprogramar a otro cupo libre de una agenda del mismo servicio (otro día, hora, médico o lugar); la cita vuelve a
  "agendada".
- Aviso si la cita cambió desde que se abrió.
- Evento en el historial por cada paso (la reprogramación con el cupo anterior).

### No incluye

- Lista de espera para cupos liberados.
- Cobro por inasistencia.

## Criterios de aceptación

- [ ] **Dado que** la cita está "agendada", **cuando** la confirmo, **entonces** queda "confirmada".
- [ ] **Dado que** la cita está "confirmada", **cuando** intento confirmarla otra vez, **entonces** el sistema
      indica que ese paso no es posible en su estado.
- [ ] **Dado que** cancelo una cita con el motivo "El paciente viaja", **cuando** guardo, **entonces** queda
      "cancelada", el motivo se ve en la cita y el cupo vuelve a estar libre.
- [ ] **Dado que** cancelo sin motivo, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** reprogramo a un cupo libre de otra agenda del mismo servicio, **cuando** guardo, **entonces** la
      cita queda "agendada" en el nuevo cupo y el anterior se libera.
- [ ] **Dado que** elijo un cupo de otro servicio, **cuando** reprogramo, **entonces** se rechaza.
- [ ] **Dado que** otra persona cambió la cita mientras yo la tenía abierta, **cuando** guardo, **entonces** el
      sistema me avisa del conflicto.
- [ ] **Dado que** reprogramé la cita, **cuando** veo el historial del paciente, **entonces** aparece el cupo anterior
      y el nuevo.

## Estados de error y vacíos

- Cita cancelada: sus acciones quedan deshabilitadas.
- Sin cupos libres del mismo servicio: mensaje "No hay cupos disponibles para reprogramar".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Reprogramar | Vuelve a "agendada" para que el paciente confirme la nueva hora. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Estados de la cita | agendada → confirmada; cancelada desde ambas. |
| Reprogramar | Solo mismo servicio. |

## Requisitos de consistencia

Las acciones viven en el detalle de la cita de la Historia 3, con los mismos mensajes de conflicto que pacientes.

## Áreas que cambia

El detalle de la cita en la agenda y el historial del paciente.

## Áreas que no debe cambiar

La llegada del paciente y su turno (Épica 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Confirmar una cita y volver a intentarlo.
2. Cancelar otra con motivo y comprobar el cupo libre.
3. Reprogramar una cita a otro día del mismo servicio.
4. Revisar el historial del paciente.

## Evidencia

Commit `0da51cb`. Pruebas: `api/test/scheduling.e2e-spec.ts`, unitarios de `appointment.entity`.
