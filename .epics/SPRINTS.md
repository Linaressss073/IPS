# Sprints de 7 días

Sprints de una semana desde el primer commit del proyecto (`0868629`, **jueves 1 de octubre de 2026**). Cada sprint
va de jueves a miércoles. Los sprints 1 a 3 se reconstruyen a partir de la fecha de cada commit; del 4 en adelante son
una propuesta, pendiente de aprobar las épicas 7 a 9.

| Sprint | Fechas | Estado | Objetivo |
|---|---|---|---|
| Sprint 1 | 1 – 7 oct 2026 | ✅ Cerrado | Recorrido completo de la consulta externa: plataforma, pacientes, agendamiento, admisión, consulta y farmacia |
| Sprint 2 | 8 – 14 oct 2026 | ✅ Cerrado (sin commits) | — |
| Sprint 3 | 15 – 21 oct 2026 | 🟡 Activo (cierra hoy) | Corrección de farmacia, limpieza del repositorio y backlog del proyecto |
| Sprint 4 | 22 – 28 oct 2026 | 📝 Propuesto | Épica 7: calidad continua y operación |
| Sprint 5 | 29 oct – 4 nov 2026 | 📝 Propuesto | Épica 8: comunicación con el paciente |
| Sprint 6 | 5 – 11 nov 2026 | 📝 Propuesto | Épica 9: indicadores de la consulta externa |

## Sprint 1 · 1 – 7 oct 2026

Todo el trabajo funcional se hizo entre el 1 y el 3 de octubre.

| Día | Commits | Historias (Jira) |
|---|---|---|
| 1 oct | `0868629` base y pacientes, `2213be6` `639e0c7` Render | IPS-11, IPS-12, IPS-13, IPS-14, IPS-30 (épica IPS-2) |
| 2 oct | `98a9dbd` Clerk, `78538b0`, `b6ba341` español, `937a0b1` personal, `378cca1` organizaciones, `a847b70`, `8f10e9c` roles, `f69661b` MongoDB, `1dfaba6`…`09986e0` migración de datos | IPS-7, IPS-8, IPS-9, IPS-10 (épica IPS-1) |
| 2 oct | `0da51cb` agendamiento, `dbca2c4`, `7ed609d` reconciliación, `024010c` `040f538` landing | IPS-15, IPS-16, IPS-17, IPS-18 (épica IPS-3) |
| 3 oct | `0bfbc72` admisión y turnos, `3ad22b8` agenda | IPS-19, IPS-20, IPS-21, IPS-22 (épica IPS-4) |
| 3 oct | `de76ef9` consulta médica | IPS-25, IPS-23, IPS-24, IPS-26 (épica IPS-5) |
| 3 oct | `a00150c` dispensación, `f9e5210` inventario FEFO | IPS-27, IPS-28, IPS-31, IPS-29, IPS-32 (épica IPS-6) |

**Resultado:** 6 épicas y 26 historias terminadas.

## Sprint 2 · 8 – 14 oct 2026

Sin commits. Si hubo trabajo fuera del repositorio (pruebas manuales, revisión con la IPS, documentación del curso),
se registra aquí.

## Sprint 3 · 15 – 21 oct 2026

| Día | Trabajo | Tipo | Jira |
|---|---|---|---|
| 20 oct | `b2acae2` Farmacia: entregar dos ítems del mismo producto en una dispensación (409 `STOCK_CHANGED`) | Error | IPS-125 (relacionado con IPS-32) |
| 21 oct | `16fe209` Limpieza: README al día, sin `@types/pg` ni `package-lock` del frontend | Tarea | IPS-126 |
| 21 oct | Backlog: épicas e historias (`.epics/`), skills de pair y `epic-runner`, tablero de Jira | Tarea (en curso) | IPS-127 |

## Sprints 4 a 6 · propuestos

| Sprint | Épica | Historias |
|---|---|---|
| Sprint 4 · 22 – 28 oct | 7. Calidad continua y operación (IPS-33) | IPS-36 Render solo despliega lo verificado · IPS-37 Pruebas de aislamiento y permisos · IPS-38 Aviso cuando el servidor despierta |
| Sprint 5 · 29 oct – 4 nov | 8. Comunicación con el paciente (IPS-34) | IPS-39 Autorización de comunicaciones · IPS-47 Correo al agendar, reprogramar o cancelar · IPS-40 Recordatorio el día anterior |
| Sprint 6 · 5 – 11 nov | 9. Indicadores de la consulta externa (IPS-35) | IPS-42 Oportunidad de citas (con rol Administrador médico) · IPS-46 Inasistencia y tiempos de espera · IPS-45 Cumplimiento de la dispensación |

## Jira

Tablero: <https://kontiasolutions.atlassian.net/jira/software/projects/IPS/boards/34>. Las 26 historias del Sprint 1
tienen 77 subtareas terminadas, cada una enlazada a los commits de GitHub que la implementaron.
