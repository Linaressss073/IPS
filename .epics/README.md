# Épicas e historias de usuario

Backlog del **Sistema de Información Hospitalaria para la Consulta Externa**, en el formato de la skill
`epic-runner` (`.claude/skills/epic-runner`): cada `Epic-N/` tiene su `epic-overview.md`, una historia por archivo
`STORY-N-*.md` y su estado en `.scrum-state.json`. Las historias siguen INVEST, son cortes verticales y sus criterios
de aceptación están en formato **Dado que / Cuando / Entonces**.

| Épica | Historias | Estado |
|---|:-:|---|
| [1. Plataforma multi-IPS, acceso y personal](Epic-1/epic-overview.md) | 4 | ✅ Implementada |
| [2. Registro único de pacientes y trazabilidad](Epic-2/epic-overview.md) | 5 | ✅ Implementada |
| [3. Agendamiento de citas](Epic-3/epic-overview.md) | 4 | ✅ Implementada |
| [4. Admisión y turnos con pantalla de sala](Epic-4/epic-overview.md) | 4 | ✅ Implementada |
| [5. Consulta médica e historia clínica](Epic-5/epic-overview.md) | 4 | ✅ Implementada |
| [6. Farmacia: dispensación e inventario](Epic-6/epic-overview.md) | 5 | ✅ Implementada |
| [7. Calidad continua y operación](Epic-7/epic-overview.md) | 3 | 📝 Propuesta |
| [8. Comunicación con el paciente](Epic-8/epic-overview.md) | 3 | 📝 Propuesta |
| [9. Indicadores de la consulta externa](Epic-9/epic-overview.md) | 3 | 📝 Propuesta |

Recorrido del paciente que cubren las épicas 1 a 6:

```
Registro (E2) ─► Cita (E3) ─► Llegada y turno (E4) ─► Consulta firmada (E5) ─► Dispensación (E6)
      └──────────────── historial único del paciente, con requestedBy / executedBy ────────────────┘
```

## Cómo seguir

- `/epic-runner status`: estado de la épica activa.
- `/epic-runner groom 1` sobre una épica propuesta: revisa la historia, resuelve sus preguntas abiertas y la deja
  lista para planear (`plan`), implementar (`implement`), probar (`test`) y entregar (`review`).
- Las historias de las épicas 1 a 6 documentan lo ya construido; sirven como referencia y como casos de prueba manual.
