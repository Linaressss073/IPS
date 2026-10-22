# Épica 5: Consulta médica e historia clínica

## Objetivo

Que el médico registre la atención de cada cita en una historia clínica estructurada (motivo, enfermedad actual,
examen físico, signos vitales, diagnósticos CIE-10, plan y fórmula médica) y la **firme**, tras lo cual queda
inmodificable y solo admite notas aclaratorias. La fórmula firmada es lo que recibe Farmacia (Épica 6). Solo los
médicos leen el contenido clínico; el historial compartido del paciente registra que hubo consulta, sin detalles.

**Estado:** implementada (commit `de76ef9` del 3 de octubre de 2026).

## Documentos de referencia

- `api/README.md` (contexto `consultation`).
- `technical-api/08-consultation.md`.
- Resolución 1995 de 1999 (manejo de la historia clínica en Colombia): integridad, inalterabilidad y firma.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Una consulta por cita | Iniciarla de nuevo devuelve la misma. |
| Quién escribe | Solo el médico de la cita escribe, firma y agrega notas aclaratorias. |
| Quién lee | Cualquier médico de la IPS (continuidad de la atención); ningún otro rol, ni el administrador. |
| Borrador | Se guarda cuantas veces se quiera mientras está "en curso"; bloqueo optimista. |
| Firma | Exige motivo de consulta y un diagnóstico principal. Firmada es inmodificable. |
| Corrección | Solo con notas aclaratorias con fecha y autor; nunca se borran. |
| Historial compartido | Sin contenido clínico: solo que se inició, firmó o aclaró la consulta de tal cita. |
| Signos vitales | Solo lo medido, cada uno una vez y en rango fisiológico; IMC calculado si hay peso y talla. |
| Diagnósticos | CIE-10, sin repetir, máximo 10, a lo sumo uno principal. |
| Fórmula | Máximo 20 ítems con medicamento, presentación, dosis, vía, frecuencia, duración y cantidad. |

## Orden de las historias

### Historia 1: Iniciar la consulta y guardar el borrador

**Prioridad**: sin borrador no hay historia que firmar.
El médico abre la consulta desde su cita (hoy o anterior), escribe la nota y los signos vitales y guarda cuantas
veces necesite; ve el IMC calculado.
**Dependencias**: Épica 3, Épica 4 (el turno atendido es el flujo natural, no un requisito).

### Historia 2: Diagnósticos CIE-10 y fórmula médica

**Prioridad**: la firma exige diagnóstico y la farmacia necesita la fórmula.
El médico agrega diagnósticos CIE-10 (uno principal) y los medicamentos formulados.
**Dependencias**: Historia 1.

### Historia 3: Firmar la historia clínica

**Prioridad**: la firma la vuelve un documento legal y libera la fórmula a farmacia.
El médico firma; el sistema verifica que esté completa y desde ese momento nadie la modifica.
**Dependencias**: Historia 2.

### Historia 4: Notas aclaratorias y consulta por otros médicos

**Prioridad**: corregir sin alterar y dar continuidad a la atención.
El médico tratante agrega notas aclaratorias a una consulta firmada; otros médicos de la IPS leen las consultas del
paciente.
**Dependencias**: Historia 3.

## Contexto compartido para el detalle de historias

- **API:** `api/src/contexts/consultation/` (`consultation.entity.ts`, `consultation.commands.ts`,
  `consultations.controller.ts`, `consultation.module.ts`).
- **Frontend:** `app/dashboard/[teamId]/consultations/[consultationId]`, `components/consultation/`
  (`consultation-record.tsx`), `lib/api/consultation.ts`.
- **Permisos:** `clinical:read`, `clinical:write` (Épica 1, Historia 4).
- **Pruebas:** `api/test/consultation.e2e-spec.ts` y unitarios del contexto `consultation`.
