# Historia 5: Historial del paciente

> Como integrante del personal, quiero ver en orden todo lo que le ha pasado a un paciente en la IPS para responder
> con certeza qué se hizo, cuándo y quién lo hizo.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: solo lectura.

## Contexto

La trazabilidad de la atención es el objetivo central del proyecto. Cada módulo (pacientes, agendamiento, admisión,
consulta y farmacia) deja eventos del recorrido del paciente. Esta historia los muestra en una sola línea de tiempo,
con quién lo pidió y quién lo ejecutó.

## Entregabilidad

Completa. El historial se enriquece solo a medida que las épicas 3 a 6 agregan eventos.

## Alcance

### Incluye

- Línea de tiempo del paciente, del evento más antiguo al más reciente.
- Para cada evento: qué pasó, cuándo, quién lo pidió y quién lo ejecutó (con nombre actual o "Usuario eliminado").
- Eventos de registro, cambios, acompañantes y, después, citas, turnos, consultas y dispensaciones.

### No incluye

- Contenido clínico (diagnósticos, notas, medicamentos): el historial lo ven roles no clínicos.
- Exportar el historial.

## Criterios de aceptación

- [ ] **Dado que** registré un paciente y luego cambié su teléfono, **cuando** abro su historial, **entonces** veo
      primero el registro y después el cambio con el valor anterior y el nuevo.
- [ ] **Dado que** un evento lo pidió una persona y lo ejecutó otra, **cuando** lo veo, **entonces** aparecen ambos
      nombres.
- [ ] **Dado que** una persona del personal fue eliminada, **cuando** veo sus eventos, **entonces** aparece
      "Usuario eliminado".
- [ ] **Dado que** el paciente tuvo una consulta, **cuando** veo su historial, **entonces** aparece la consulta, su
      cita y servicio, pero ningún diagnóstico ni nota clínica.
- [ ] **Dado que** acabo de guardar un cambio, **cuando** abro el historial, **entonces** el cambio ya aparece.

## Estados de error y vacíos

- Paciente recién creado: el historial muestra solo el registro.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Orden | Más antiguo primero. |
| Contenido clínico | Excluido del historial compartido. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Historial | Solo se agregan eventos; se ve al instante. |

## Requisitos de consistencia

El historial vive en la ficha del paciente (Historia 2).

## Áreas que cambia

La sección de historial de la ficha del paciente.

## Áreas que no debe cambiar

Los datos y acompañantes del paciente (Historias 3 y 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Registrar un paciente, cambiar un dato y agregar un acompañante.
2. Agendarle una cita, admitirlo y atenderlo.
3. Abrir su historial y comprobar el orden y los nombres, sin datos clínicos.

## Evidencia

Commit `0868629` y eventos agregados por los commits de agendamiento, admisión, consulta y farmacia.
Pruebas: `api/test/patients.e2e-spec.ts` y los e2e de cada módulo.
