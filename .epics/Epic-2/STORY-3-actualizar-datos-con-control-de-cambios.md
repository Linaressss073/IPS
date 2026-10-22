# Historia 3: Actualizar datos con control de cambios

> Como auxiliar de admisión, quiero corregir los datos de un paciente sin pisar los cambios de un compañero para que
> la información sea correcta y quede claro quién cambió qué.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Los datos del paciente cambian: teléfono, dirección, EPS o régimen. Dos personas pueden estar editando al mismo
tiempo. Esta historia permite editar por grupos de datos, avisa si alguien guardó antes y deja cada cambio en el
historial con su valor anterior y el nuevo.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Edición de documento, nombres, nacimiento, sexo, contacto y afiliación.
- Aviso de conflicto si el paciente cambió desde que se abrió.
- Registro de cada campo cambiado con valor anterior y nuevo, quién lo pidió y quién lo hizo.

### No incluye

- Deshacer un cambio.
- Aprobación de cambios por un supervisor.

## Criterios de aceptación

- [ ] **Dado que** abro la ficha de un paciente, **cuando** cambio su teléfono y guardo, **entonces** el nuevo
      teléfono queda guardado y el historial muestra el anterior y el nuevo.
- [ ] **Dado que** un compañero guardó cambios después de que abrí la ficha, **cuando** guardo los míos,
      **entonces** el sistema me avisa del conflicto y no pisa su cambio.
- [ ] **Dado que** guardo sin cambiar nada, **cuando** confirmo, **entonces** no se registra ningún evento.
- [ ] **Dado que** cambio el documento a uno que ya tiene otro paciente, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** cambio el régimen a "particular", **cuando** guardo con EPS, **entonces** se rechaza.

## Estados de error y vacíos

- Conflicto: mensaje con opción de recargar la ficha.
- Error de validación: junto al campo, sin perder lo escrito.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Grupos | Cada grupo enviado reemplaza al actual completo. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Ediciones simultáneas | Bloqueo optimista. |
| Trazabilidad | `requestedBy` / `executedBy`. |

## Requisitos de consistencia

El formulario de edición se comporta igual que el de registro (Historia 1): mismas validaciones y mensajes.

## Áreas que cambia

La ficha del paciente (modo edición).

## Áreas que no debe cambiar

Los acompañantes (Historia 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Cambiar el teléfono y revisar el historial.
2. Abrir la misma ficha en dos pestañas y guardar en ambas: comprobar el aviso.
3. Guardar sin cambios y comprobar que el historial no cambia.

## Evidencia

Commit `0868629`. Pruebas: `api/test/patients.e2e-spec.ts`.
