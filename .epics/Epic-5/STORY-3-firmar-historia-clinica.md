# Historia 3: Firmar la historia clínica

> Como médico, quiero firmar la historia clínica al terminar la consulta para que quede como documento definitivo y
> la fórmula pase a farmacia.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

La historia clínica es un documento legal que, una vez firmado, no puede alterarse. Esta historia permite firmar la
consulta, verifica que tenga lo mínimo y la bloquea para siempre; la fórmula firmada queda disponible para farmacia.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Firmar la consulta en curso (solo el médico de la cita).
- Verificación de motivo de consulta y diagnóstico principal, indicando qué falta.
- Bloqueo de toda edición posterior.
- Fecha de firma visible; evento "consulta firmada" en el historial del paciente.

### No incluye

- Firma digital con certificado.
- Impresión o PDF de la historia.

## Criterios de aceptación

- [ ] **Dado que** la consulta tiene motivo y diagnóstico principal, **cuando** la firmo, **entonces** queda
      "firmada" con fecha y hora.
- [ ] **Dado que** falta el diagnóstico principal, **cuando** intento firmar, **entonces** el sistema dice qué falta y
      no firma.
- [ ] **Dado que** la consulta está firmada, **cuando** intento cambiar la nota o los diagnósticos, **entonces** el
      sistema no lo permite.
- [ ] **Dado que** no soy el médico de la cita, **cuando** intento firmar, **entonces** se me niega.
- [ ] **Dado que** la consulta tiene fórmula y la firmo, **cuando** farmacia busca las fórmulas de hoy, **entonces**
      la encuentra.

## Estados de error y vacíos

- Consulta incompleta: lista de lo que falta junto al botón de firmar.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Firma | Acción explícita del médico tratante, con confirmación. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Firma | Exige motivo y diagnóstico principal; firmada es inmodificable. |

## Requisitos de consistencia

La consulta firmada se ve igual que el borrador, en modo solo lectura.

## Áreas que cambia

La consulta (firma y modo solo lectura) y el historial del paciente.

## Áreas que no debe cambiar

La dispensación (Épica 6).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Intentar firmar sin diagnóstico principal.
2. Completar y firmar.
3. Intentar editar la consulta firmada.
4. Como farmacia, buscar la fórmula del día.

## Evidencia

Commit `de76ef9`. Pruebas: `api/test/consultation.e2e-spec.ts`.
