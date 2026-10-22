# Historia 2: Llamar, atender o cerrar como "no se presentó"

> Como médico, auxiliar de admisión o farmacéutico, quiero llamar al siguiente turno y cerrarlo al atenderlo para que
> la sala avance en orden y quede registro de cada paciente atendido.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Con los turnos en espera, quien atiende los llama uno a uno, los marca atendidos o, si el paciente no responde, los
cierra como "no se presentó". Esta historia entrega la lista del día y esas acciones.

## Entregabilidad

Completa: el llamado se ve en la lista; la pantalla de sala llega en la Historia 3.

## Alcance

### Incluye

- Lista de turnos del día en orden de llegada, filtrable por estado y médico.
- Llamar (y volver a llamar hasta el máximo), marcar atendido (también sin llamado previo) y "no se presentó".
- Aviso si el turno cambió desde que se abrió.
- Evento en el historial por cada acción.

### No incluye

- Transferir un turno a otro servicio.
- Reabrir un turno cerrado.

## Criterios de aceptación

- [ ] **Dado que** RTH 4 está en espera, **cuando** lo llamo, **entonces** pasa a "anunciado" con 1 llamado.
- [ ] **Dado que** RTH 4 ya alcanzó el máximo de llamados, **cuando** lo llamo otra vez, **entonces** el sistema indica
      que no se puede llamar más.
- [ ] **Dado que** el paciente entró al consultorio, **cuando** marco "atendido", **entonces** el turno se cierra.
- [ ] **Dado que** el paciente no responde, **cuando** marco "no se presentó", **entonces** el turno se cierra con ese
      estado.
- [ ] **Dado que** el turno está cerrado, **cuando** intento llamarlo, **entonces** se rechaza.
- [ ] **Dado que** el sistema reanunció el turno justo antes de mi clic, **cuando** guardo, **entonces** se me avisa
      del conflicto y la lista se actualiza.
- [ ] **Dado que** tengo solo el rol de agendamiento, **cuando** abro la lista de turnos, **entonces** se me niega.

## Estados de error y vacíos

- Sin turnos hoy: "No hay turnos para hoy".
- Filtro sin resultados: "No hay turnos con este estado".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Quién llama | Admisión, médico y farmacia; "no se presentó" también admisión. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Estados | en espera → anunciado → atendido / no se presentó. |
| Ediciones simultáneas | Bloqueo optimista por turno. |

## Requisitos de consistencia

La lista muestra los mismos turnos y etiquetas (RTH 4) que creó la Historia 1.

## Áreas que cambia

La pantalla de turnos y el historial del paciente.

## Áreas que no debe cambiar

La pantalla de sala (Historia 3).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Registrar dos llegadas.
2. Llamar la primera y marcarla atendida.
3. Llamar la segunda hasta el máximo y luego cerrarla como "no se presentó".
4. Revisar el historial de ambos pacientes.

## Evidencia

Commit `0bfbc72`. Pruebas: `api/test/admission.e2e-spec.ts`, unitarios de `turn.entity`.
