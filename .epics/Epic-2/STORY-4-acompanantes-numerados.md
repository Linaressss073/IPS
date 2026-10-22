# Historia 4: Acompañantes numerados

> Como auxiliar de admisión, quiero registrar a quien acompaña al paciente en cada visita para saber quién es su
> acudiente o cuidador sin perder a los anteriores.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Menores de edad y pacientes dependientes llegan con un acudiente, familiar o cuidador, y puede ser distinto en cada
visita. Esta historia registra cada acompañante con un número consecutivo y conserva el historial de todos.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Registrar acompañante con parentesco, nombre, documento, teléfono y correo (todo opcional, pero con nombre o
  teléfono).
- Numeración consecutiva por paciente (#1, #2…).
- Lista de acompañantes, el más reciente primero.

### No incluye

- Editar o borrar un acompañante ya registrado.
- Acompañante como usuario del sistema.

## Criterios de aceptación

- [ ] **Dado que** el paciente ya tiene el acompañante #1, **cuando** registro a su madre, **entonces** queda como
      #2 y el #1 se conserva.
- [ ] **Dado que** dos personas registran un acompañante al mismo tiempo, **cuando** ambas guardan, **entonces**
      quedan con números distintos.
- [ ] **Dado que** no escribo nombre ni teléfono, **cuando** guardo, **entonces** el sistema lo rechaza.
- [ ] **Dado que** elijo un parentesco, **cuando** abro la lista, **entonces** veo uno de: madre, padre, hijo,
      cónyuge, hermano, familiar, cuidador u otro.
- [ ] **Dado que** abro la ficha del paciente, **cuando** veo los acompañantes, **entonces** aparecen del más reciente
      al más antiguo.

## Estados de error y vacíos

- Sin acompañantes: "Sin acompañantes registrados" con el botón para agregar.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Almacenamiento | Cada acompañante es un evento del historial; no se sobrescribe nada. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Acompañantes | Numerados y sin sobrescribir. |

## Requisitos de consistencia

La tarjeta de acompañantes vive en la ficha del paciente (Historia 2) con su mismo estilo.

## Áreas que cambia

La tarjeta de acompañantes de la ficha del paciente.

## Áreas que no debe cambiar

Los datos personales del paciente (Historia 3).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Registrar un paciente con acompañante inicial.
2. Agregar dos acompañantes más y comprobar los números #2 y #3.
3. Intentar guardar un acompañante vacío.

## Evidencia

Commit `0868629`. Pruebas: `api/test/patients.e2e-spec.ts`.
