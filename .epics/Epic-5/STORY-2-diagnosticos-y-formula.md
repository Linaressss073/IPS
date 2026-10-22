# Historia 2: Diagnósticos CIE-10 y fórmula médica

> Como médico, quiero registrar los diagnósticos y formular los medicamentos para que la historia quede completa y
> farmacia sepa qué entregar.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*.

## Contexto

Toda consulta termina con uno o varios diagnósticos codificados en CIE-10 y, a menudo, con una fórmula. Esta
historia agrega ambos al borrador, con las validaciones necesarias para que la fórmula se pueda dispensar sin
ambigüedad.

## Entregabilidad

Completa: diagnósticos y fórmula se guardan con el borrador.

## Alcance

### Incluye

- Diagnósticos con código CIE-10, descripción y marca de principal.
- Fórmula: medicamento, presentación, dosis, vía, frecuencia, duración en días, cantidad e indicaciones.

### No incluye

- Catálogo oficial CIE-10 con búsqueda (se valida el formato del código).
- Alertas de interacciones o alergias.
- Prescripción en MIPRES.

## Criterios de aceptación

- [ ] **Dado que** agrego el diagnóstico J06.9 como principal, **cuando** guardo, **entonces** queda registrado.
- [ ] **Dado que** marco dos diagnósticos como principales, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** repito un código o agrego más de 10, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** escribo un código que no tiene formato CIE-10, **cuando** guardo, **entonces** se rechaza.
- [ ] **Dado que** formulo "Acetaminofén 500 mg, tableta, 1 tableta, oral, cada 8 horas, 5 días, 15 unidades",
      **cuando** guardo, **entonces** el ítem queda en la fórmula.
- [ ] **Dado que** elijo una vía que no está en la lista o una duración mayor a 365 días, **cuando** guardo,
      **entonces** se rechaza.
- [ ] **Dado que** la fórmula tiene 20 ítems, **cuando** agrego otro, **entonces** se rechaza.

## Estados de error y vacíos

- Sin diagnósticos: la sección invita a agregar el principal.
- Sin fórmula: la consulta puede firmarse sin medicamentos.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Vías | oral, sublingual, intravenosa, intramuscular, subcutánea, tópica, inhalada, oftálmica, ótica, nasal, rectal, vaginal, transdérmica. |
| Cantidad | 1 a 1000 unidades por ítem. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Diagnósticos | CIE-10, máximo 10, uno principal. |
| Fórmula | Máximo 20 ítems. |

## Requisitos de consistencia

Diagnósticos y fórmula se editan en la misma pantalla y con el mismo guardado del borrador (Historia 1).

## Áreas que cambia

Las secciones de diagnósticos y fórmula de la consulta.

## Áreas que no debe cambiar

La firma (Historia 3) y la vista de farmacia (Épica 6).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Agregar J06.9 como principal e I10 como secundario.
2. Intentar marcar ambos como principales.
3. Formular dos medicamentos y guardar.
4. Recargar y comprobar que todo se conserva.

## Evidencia

Commit `de76ef9`. Pruebas: `api/test/consultation.e2e-spec.ts`.
