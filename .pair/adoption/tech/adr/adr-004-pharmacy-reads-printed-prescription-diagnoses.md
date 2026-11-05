# ADR: Farmacia lee los diagnósticos de la fórmula impresa

## Status

Accepted

## Date

2026-11-04

## Context

- La matriz de roles dice que el registro clínico es solo para médicos y que farmacia ve únicamente la fórmula (medicamentos y cantidades), nunca diagnósticos.
- La fórmula médica colombiana lleva los diagnósticos (la de ejemplo de EPS Sanitas los muestra), y el PDF debe poder generarlo también farmacia.
- El endpoint `GET /consultations/:id/formula` acepta `clinical:read` o `pharmacy:dispense` y funciona con cualquier consulta firmada y con medicamentos de la IPS, no solo con las que farmacia tiene pendientes.
- La revisión de código (Sprint 5) señaló que esto amplía lo que farmacia puede leer.

## Options Considered

### Option 1: Fórmula de farmacia sin diagnósticos

- **Description**: Farmacia recibe la misma fórmula sin la sección de diagnósticos.
- **Pros**: Respeta la regla anterior sin excepciones.
- **Cons**: La copia de farmacia difiere de la del médico y del formato oficial.

### Option 2: Farmacia ve los diagnósticos de la fórmula

- **Description**: Mismo contenido para el médico y para farmacia.
- **Pros**: Una sola fórmula, igual al formato oficial.
- **Cons**: Farmacia puede leer los diagnósticos de cualquier consulta firmada de la IPS.

## Decision

Opción 2, decidida por la persona responsable del producto el 2026-11-04: dejar los diagnósticos para farmacia y documentarlo. Sigue sin entregarse la nota clínica ni los signos vitales.

## Consequences

### Benefits

- El PDF es idéntico para el médico y para farmacia y coincide con el formato colombiano.

### Trade-offs and Limitations

- **Riesgo aceptado:** farmacia puede enumerar ids de consulta y leer diagnósticos, fecha de nacimiento y EPS de pacientes a los que no dispensa. Una mitigación futura es limitar el endpoint a consultas con una fórmula pendiente o un turno de farmacia.
- Contradice la regla general de la matriz; queda documentada como excepción en la guía técnica.

## Adoption Impact

- `technical-api/09-pharmacy.md` y `technical-api/README.md`: ya documentan la excepción.
- `adoption/tech/architecture.md`: registrar la excepción junto al modelo de permisos.
