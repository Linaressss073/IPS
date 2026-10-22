# Épica 2: Registro único de pacientes y trazabilidad

## Objetivo

Registrar a cada paciente **una sola vez por IPS** para que ninguna área vuelva a pedirle sus datos, y dejar en un
historial único cada paso de su recorrido (registro, cambios, citas, turnos, consulta, farmacia) con quién lo pidió y
quién lo ejecutó. Es la columna vertebral de la trazabilidad que pide el proyecto: responde "¿qué pasó con este
paciente?".

**Estado:** implementada (commit `0868629` del 1 de octubre de 2026 y ajustes posteriores).

## Documentos de referencia

- `api/README.md` (lenguaje ubicuo: paciente, documento, afiliación, acompañante, evento de trazabilidad,
  `requestedBy` / `executedBy`, CQRS sobre MongoDB).
- `technical-api/02-patients.md`.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Unicidad | Tipo + número de documento es único dentro de la IPS. El número se guarda sin puntos, espacios ni guiones. |
| Tipos de documento | Los colombianos: CC, CE, TI, RC, NIT, PA, PPT, PEP, CD, SC, CN, AS, MS. |
| Afiliación | EPS + régimen (contributivo, subsidiado, especial, particular). Particular no lleva EPS; los demás sí. |
| Borrado | Un paciente nunca se borra. |
| Trazabilidad | Cada cambio guarda `requestedBy` (quién lo pidió, por defecto quien actúa) y `executedBy` (quien actúa), en la misma transacción que el cambio. |
| Historial | Solo se agregan eventos, nunca se modifican; se ve al instante. |
| Ediciones simultáneas | Bloqueo optimista: si alguien guardó antes, se avisa en lugar de pisar el cambio. |
| Acompañantes | Numerados (#1, #2…); uno nuevo nunca sobrescribe al anterior. |
| Búsqueda | Por documento o nombres, sin importar tildes ni mayúsculas; máximo 100 por página. |

## Orden de las historias

### Historia 1: Registrar paciente

**Prioridad**: sin paciente registrado no hay cita, turno ni consulta.
Admisión o agendamiento registra al paciente con documento, nombres, nacimiento, sexo, contacto y afiliación; el
sistema impide registrar dos veces el mismo documento en la IPS.
**Dependencias**: Épica 1.

### Historia 2: Buscar y consultar pacientes

**Prioridad**: antes de registrar hay que poder verificar si ya existe.
Búsqueda por documento o nombre sin importar tildes, con paginación, y ficha completa del paciente.
**Dependencias**: Historia 1.

### Historia 3: Actualizar datos con control de cambios

**Prioridad**: los datos cambian (teléfono, EPS) y cada cambio debe quedar trazado.
Edición por grupos de datos con aviso de conflicto si otra persona guardó antes; cada cambio real queda con su valor
anterior y nuevo.
**Dependencias**: Historia 2.

### Historia 4: Acompañantes numerados

**Prioridad**: menores y pacientes dependientes llegan con acudiente o cuidador.
Registro de quien acompaña al paciente, numerado y sin sobrescribir a los anteriores, con su historial.
**Dependencias**: Historia 2.

### Historia 5: Historial del paciente

**Prioridad**: es la respuesta a "¿qué pasó con este paciente?".
Línea de tiempo con todos los eventos del paciente, en orden, con quién lo pidió y quién lo ejecutó.
**Dependencias**: Historias 1 a 4 (y se enriquece con las épicas 3 a 6).

## Contexto compartido para el detalle de historias

- **API:** `api/src/contexts/patients/` (`patient.entity.ts`, `register-patient.command.ts`,
  `update-patient.command.ts`, `record-companion.command.ts`, `patient-commands.controller.ts`,
  `patient-queries.controller.ts`).
- **Trazabilidad:** `api/src/shared/application/types/trace-event.types.ts`,
  `api/src/shared/infrastructure/persistence/trace-event.writer.ts`,
  `api/src/shared/application/services/actor-resolver.service.ts`.
- **Utilidades:** `api/src/shared/domain/utils/search-text.ts`, `contact-normalization.ts`.
- **Frontend:** `app/dashboard/[teamId]/patients/` (lista, `new`, `[patientId]`), `components/patients/`
  (`companions-card.tsx`, `error-message.ts`, `use-team-members.ts`), `lib/api/patients.ts`.
- **Pruebas:** `api/test/patients.e2e-spec.ts` y unitarios del contexto `patients`.
