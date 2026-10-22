# Historia 1: Iniciar la consulta y guardar el borrador

> Como médico, quiero abrir la historia clínica de mi cita y guardar lo que voy registrando para no perder información
> mientras atiendo al paciente.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: es una pantalla nueva, solo para el rol médico.

## Contexto

Durante la consulta el médico registra el motivo, la enfermedad actual, el examen físico, el plan y los signos
vitales. Esta historia le permite iniciar la historia clínica desde su cita y guardarla como borrador tantas veces como
necesite.

## Entregabilidad

Completa: el borrador se guarda y se puede retomar; la firma llega en la Historia 3.

## Alcance

### Incluye

- Iniciar la consulta desde una cita propia de hoy o anterior.
- Nota: motivo, enfermedad actual, examen físico y plan.
- Signos vitales: presión arterial, frecuencias cardiaca y respiratoria, temperatura, saturación, peso y talla.
- IMC calculado cuando hay peso y talla.
- Aviso si el borrador cambió en otra pestaña.

### No incluye

- Antecedentes, revisión por sistemas ni plantillas por especialidad.
- Órdenes de laboratorio o imágenes.

## Criterios de aceptación

- [ ] **Dado que** tengo una cita hoy con un paciente, **cuando** inicio la consulta, **entonces** se abre la historia
      en estado "en curso" con los datos del paciente, la cita, el servicio y el lugar.
- [ ] **Dado que** ya inicié la consulta de esa cita, **cuando** la inicio de nuevo, **entonces** se abre la misma, no
      una nueva.
- [ ] **Dado que** la cita es de otro médico, está cancelada o es futura, **cuando** intento iniciarla, **entonces**
      el sistema no lo permite.
- [ ] **Dado que** registro peso 70 kg y talla 175 cm, **cuando** guardo, **entonces** veo el IMC 22.9.
- [ ] **Dado que** registro una temperatura de 50 °C, **cuando** guardo, **entonces** se rechaza indicando el rango
      válido (30 a 45 °C).
- [ ] **Dado que** guardé el borrador en otra pestaña, **cuando** guardo en esta, **entonces** se me avisa del
      conflicto.
- [ ] **Dado que** inicié la consulta, **cuando** se abre el historial del paciente, **entonces** aparece "consulta
      iniciada" sin contenido clínico.

## Estados de error y vacíos

- Signos no medidos: se dejan vacíos, no en cero.
- Error al guardar: mensaje visible sin perder lo escrito.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Rangos | Sistólica 50-260, diastólica 30-160 mmHg; FC 20-250; FR 5-80; temperatura 30-45 °C (1 decimal); saturación 50-100 %; peso 0.3-400 kg; talla 20-250 cm. |
| Longitud | Motivo hasta 1000 caracteres; los demás campos hasta 4000. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Una consulta por cita | Iniciar de nuevo devuelve la misma. |
| Quién escribe | Solo el médico de la cita. |
| Historial compartido | Sin contenido clínico. |

## Áreas que cambia

La pantalla de la consulta y el historial del paciente.

## Áreas que no debe cambiar

La firma (Historia 3).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Como médico, iniciar la consulta de una cita de hoy.
2. Registrar nota y signos vitales; guardar y recargar.
3. Probar un valor fuera de rango.
4. Revisar el historial del paciente como auxiliar de admisión.

## Evidencia

Commit `de76ef9`. Pruebas: `api/test/consultation.e2e-spec.ts`, unitarios de `consultation.entity`.
