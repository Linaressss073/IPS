# Decision: Vistas de la API tipadas con uniones del dominio en vez de string

## Date

2026-11-04

## Status

Active

## Category

Convention Adoption

## Context

Campos de valores cerrados (estado del turno, de la cita, de la consulta y de la IPS; sexo; roles; permisos) estaban tipados como `string` en las vistas y en los documentos de Mongo. La especificación OpenAPI no traía enums y el frontend no podía validarlos al compilar. La persona responsable del producto pidió usar siempre enums para conjuntos cerrados.

## Decision

Toda vista, documento y DTO con un conjunto cerrado de valores se tipa con la unión derivada de la constante del dominio (`(typeof X)[number]`), nunca con `string`. Aplicado a `TurnView`, `BoardCall`, `AppointmentView`, `ConsultationView`, `OrganizationView`, `PatientView.sex`, `StaffMemberView.roles` y `MyAccessView` (roles y permisos), y a los documentos `patient.document` y `staff.document`.

## Alternatives Considered

- **Dejar `string` y validar en ejecución**: no permite que el compilador del frontend detecte errores.
- **Enums de TypeScript (`enum`)**: se prefiere la unión literal derivada de una constante `as const`, que ya usa el dominio.

## Consequences

`openapi.json` trae enums y el frontend los usa sin conversiones. Los valores actuales del sexo siguen siendo `H`, `M` e `I`; renombrarlos a `masculino` y `femenino` requiere migrar datos y queda pendiente de decisión.

## Adoption Impact

`adoption/tech/architecture.md`: agregar la convención "conjuntos cerrados como uniones del dominio, nunca `string`".
