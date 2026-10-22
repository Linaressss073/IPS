# Épica 4: Admisión y turnos con pantalla de sala

## Objetivo

Recibir al paciente que llega por su cita de hoy, darle un turno por servicio (RTH 4) y llamarlo en una pantalla de
sala visible para todos, con reanuncio automático y cierre como atendido o "no se presentó". Ordena la sala de espera,
protege la identidad del paciente en la pantalla y deja trazado cada llamado.

**Estado:** implementada (commit `0bfbc72` del 3 de octubre de 2026).

## Documentos de referencia

- `api/README.md` (contexto `admission`).
- `technical-api/07-admission.md`.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Turno | Uno por cita; numeración por IPS, día y código de servicio (RTH 1, RTH 2…). |
| Llegada | Solo citas de hoy (hora de Colombia), agendadas o confirmadas. Dos registros simultáneos: gana uno. |
| Estados | en espera → anunciado (llamados repetidos) → atendido o no se presentó. |
| Reanuncio | Automático cada intervalo de la IPS; tras el último llamado sin respuesta, "no se presentó". Lo hace el sistema y queda trazado como automático. |
| Pantalla de sala | La ve cualquier miembro (un televisor con una cuenta del personal). Muestra turno, lugar y solo nombre y primer apellido; nunca el documento. |
| Configuración | Por IPS: intervalo de 30 a 900 s y 1 a 5 llamados; por defecto 3 llamados cada 2 minutos. |
| Ediciones simultáneas | Bloqueo optimista por turno (un reanuncio automático puede ganarle a un clic). |

## Orden de las historias

### Historia 1: Registrar la llegada y dar turno

**Prioridad**: sin turno no hay a quién llamar.
Admisión busca la cita de hoy del paciente, registra su llegada y le entrega el turno del servicio.
**Dependencias**: Épica 3.

### Historia 2: Llamar, atender o cerrar como "no se presentó"

**Prioridad**: es el trabajo diario de quien atiende.
Lista de turnos del día con acciones para llamar, marcar atendido o no se presentó, según el rol.
**Dependencias**: Historia 1.

### Historia 3: Pantalla de sala con reanuncio automático

**Prioridad**: el paciente necesita ver su turno sin que lo llamen a gritos.
Pantalla con el turno actual y los recientes; el sistema reanuncia solo y cierra los turnos sin respuesta.
**Dependencias**: Historia 2.

### Historia 4: Configuración del llamado

**Prioridad**: cada IPS tiene salas y ritmos distintos.
El administrador ajusta el intervalo entre llamados y el número máximo de llamados.
**Dependencias**: Historia 3.

## Contexto compartido para el detalle de historias

- **API:** `api/src/contexts/admission/` (`turn.entity.ts`, `admission.commands.ts`, `admission.controller.ts`,
  `admission.module.ts` con el `TurnAnnouncer`).
- **Hora de Colombia:** `api/src/shared/domain/utils/colombia-time.ts`.
- **Frontend:** `app/dashboard/[teamId]/admission`, `app/dashboard/[teamId]/turns`,
  `app/dashboard/[teamId]/turns/screen`, `components/admission/`, `lib/api/admission.ts`.
- **Pruebas:** `api/test/admission.e2e-spec.ts` (el reanuncio se avanza a mano con `TURN_ANNOUNCER_INTERVAL_MS=0`).
