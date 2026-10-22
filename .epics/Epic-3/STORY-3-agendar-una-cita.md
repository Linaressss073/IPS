# Historia 3: Agendar una cita

> Como auxiliar de agendamiento, quiero asignar un cupo libre a un paciente registrado para que sepa cuándo, dónde y
> con quién será atendido.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Con agendas abiertas, agendamiento asigna los cupos a pacientes. Varias personas agendan a la vez, así que el sistema
debe garantizar que un cupo no se dé dos veces y que un paciente no tenga dos citas a la misma hora.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Elegir paciente (buscándolo) y un cupo libre de la vista del día.
- Agendar a nombre de otra persona del personal.
- Ver la cita con paciente, médico, servicio, ubicación, fecha y hora.
- Buscar citas por fecha, paciente o médico, y por estado.
- Evento en el historial del paciente.

### No incluye

- Que el paciente agende por sí mismo.
- Avisos al paciente (ver Épica 8).

## Criterios de aceptación

- [ ] **Dado que** el cupo de las 07:20 está libre, **cuando** se lo asigno a un paciente, **entonces** la cita queda
      "agendada" y el cupo aparece ocupado con su nombre.
- [ ] **Dado que** dos personas intentan tomar el mismo cupo al mismo tiempo, **cuando** ambas guardan, **entonces**
      solo una lo consigue y la otra recibe el aviso de que el cupo ya fue tomado.
- [ ] **Dado que** el paciente ya tiene una cita a esa hora, **cuando** intento agendarle otra, **entonces** el
      sistema lo impide.
- [ ] **Dado que** el cupo ya pasó, **cuando** intento agendarlo, **entonces** se rechaza.
- [ ] **Dado que** agendé la cita, **cuando** abro el historial del paciente, **entonces** aparece la cita con
      servicio, lugar, fecha y hora.
- [ ] **Dado que** luego se renombra el servicio, **cuando** veo la cita, **entonces** conserva el nombre que tenía al
      agendarse.

## Estados de error y vacíos

- Agenda sin cupos libres: los cupos se ven ocupados y no se pueden elegir.
- Búsqueda sin filtros: el sistema pide fecha, paciente o médico.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Búsqueda de citas | Exige fecha, paciente o médico; máximo 500 resultados ordenados por hora. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Reservas simultáneas | La base de datos decide; gana una. |
| Datos copiados | Servicio y ubicación se copian en la cita. |

## Requisitos de consistencia

El cupo se elige desde la misma vista del día de la Historia 2.

## Áreas que cambia

La pantalla de agenda (asignar cupo) y el historial del paciente.

## Áreas que no debe cambiar

Confirmar, cancelar y reprogramar (Historia 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] La doble reserva está cubierta por una prueba automática.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Agendar un paciente en un cupo libre.
2. En dos pestañas, intentar el mismo cupo para dos pacientes.
3. Intentar una segunda cita del mismo paciente a la misma hora con otro médico.
4. Revisar el historial del paciente.

## Evidencia

Commit `0da51cb`. Pruebas: `api/test/scheduling.e2e-spec.ts`.
