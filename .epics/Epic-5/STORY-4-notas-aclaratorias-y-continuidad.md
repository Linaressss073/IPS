# Historia 4: Notas aclaratorias y consulta por otros médicos

> Como médico, quiero agregar notas aclaratorias a una historia firmada y leer las consultas anteriores del paciente
> para corregir sin alterar el registro y dar continuidad a su atención.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Después de firmar pueden llegar resultados o detectarse una omisión. La historia firmada no se edita: se complementa
con notas aclaratorias con fecha y autor. Además, otro médico de la IPS que atienda al paciente necesita leer sus
consultas anteriores, mientras que ningún rol no clínico debe verlas.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Agregar notas aclaratorias a una consulta firmada (solo el médico tratante).
- Lista de consultas de un paciente, la más reciente primero, para cualquier médico de la IPS.
- Rechazo a roles no médicos.

### No incluye

- Notas aclaratorias de otro médico distinto al tratante.
- Resumen de historia clínica para el paciente.

## Criterios de aceptación

- [ ] **Dado que** la consulta está firmada, **cuando** agrego la nota "Prueba de influenza negativa", **entonces**
      aparece con mi nombre, fecha y hora, debajo de la historia original.
- [ ] **Dado que** la consulta está en curso, **cuando** intento agregar una nota aclaratoria, **entonces** el sistema
      indica que primero debe firmarse.
- [ ] **Dado que** soy otro médico de la IPS, **cuando** abro las consultas del paciente, **entonces** puedo leerlas
      pero no modificarlas ni agregar notas.
- [ ] **Dado que** soy administrador, de admisión o de farmacia, **cuando** intento abrir una consulta, **entonces** se
      me niega.
- [ ] **Dado que** agregué una nota, **cuando** veo el historial compartido del paciente, **entonces** aparece "nota
      aclaratoria agregada" sin su texto.

## Estados de error y vacíos

- Paciente sin consultas: "Este paciente no tiene consultas registradas".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Notas | Nunca se editan ni se borran. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Quién lee | Cualquier médico de la IPS. |
| Corrección | Solo con notas aclaratorias. |

## Requisitos de consistencia

Las notas aparecen en la misma vista de solo lectura de la Historia 3.

## Áreas que cambia

La consulta firmada (notas) y la lista de consultas del paciente.

## Áreas que no debe cambiar

El contenido firmado.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Firmar una consulta y agregar una nota aclaratoria.
2. Con otro médico, abrir la consulta y comprobar que solo puede leer.
3. Con un usuario de farmacia, intentar abrirla.
4. Revisar el historial compartido.

## Evidencia

Commit `de76ef9`. Pruebas: `api/test/consultation.e2e-spec.ts`.
