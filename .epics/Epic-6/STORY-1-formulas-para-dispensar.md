# Historia 1: Fórmulas firmadas para dispensar

> Como farmacéutico, quiero ver las fórmulas firmadas del día y de cada paciente para saber qué medicamentos tengo que
> entregar.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: pantalla nueva solo para el rol farmacia.

## Contexto

Cuando el médico firma una consulta con fórmula, el paciente pasa a la farmacia. Esta historia muestra a farmacia las
fórmulas pendientes, sin ningún dato clínico más allá de los medicamentos.

## Entregabilidad

Completa: la lista se ve; las entregas llegan en la Historia 2.

## Alcance

### Incluye

- Lista de fórmulas firmadas de hoy, filtrable por fecha, paciente y estado (pendiente, parcial, completa).
- Fórmulas de un paciente de cualquier día.
- Detalle: paciente, médico que firmó, fecha de firma y, por medicamento, lo formulado, entregado y pendiente.

### No incluye

- Nota clínica, signos vitales o diagnósticos.
- Fórmulas de otras IPS o externas.

## Criterios de aceptación

- [ ] **Dado que** un médico firmó hoy una consulta con dos medicamentos, **cuando** abro Farmacia, **entonces** veo
      la fórmula como "pendiente" con ambos medicamentos y sus cantidades.
- [ ] **Dado que** abro la fórmula, **cuando** la reviso, **entonces** no veo diagnósticos, notas ni signos vitales.
- [ ] **Dado que** la consulta no está firmada o no tiene medicamentos, **cuando** busco su fórmula, **entonces** el
      sistema indica que no existe.
- [ ] **Dado que** busco a un paciente, **cuando** filtro por él, **entonces** veo sus fórmulas de cualquier día.
- [ ] **Dado que** no tengo el rol de farmacia, **cuando** abro la pantalla, **entonces** se me niega.

## Estados de error y vacíos

- Sin fórmulas hoy: "No hay fórmulas firmadas para hoy".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Fecha por defecto | Hoy (hora de Colombia). |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Qué ve farmacia | Solo la fórmula y quién la firmó. |

## Áreas que cambia

La pantalla de Farmacia.

## Áreas que no debe cambiar

La consulta médica (Épica 5).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Firmar una consulta con fórmula.
2. Como farmacia, encontrarla en la lista del día.
3. Abrirla y comprobar que no hay datos clínicos.

## Evidencia

Commit `a00150c`. Pruebas: `api/test/pharmacy.e2e-spec.ts`.
