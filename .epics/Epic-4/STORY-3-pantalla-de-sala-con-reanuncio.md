# Historia 3: Pantalla de sala con reanuncio automático

> Como paciente en la sala de espera, quiero ver en una pantalla mi turno y el lugar al que debo ir para no perder mi
> llamado.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: es una pantalla nueva y el reanuncio solo actúa sobre turnos ya anunciados.

## Contexto

La sala de espera tiene un televisor. Esta historia muestra en él el turno que se está llamando y los recientes, sin
datos sensibles, y hace que el sistema vuelva a anunciar los turnos sin respuesta y los cierre tras el último llamado.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Pantalla a pantalla completa con el turno actual (turno, lugar, nombre y primer apellido) y los 6 llamados
  anteriores del día.
- Actualización automática sin intervención (consulta al servidor cada 3 segundos; sin WebSockets).
- Campanada en cada llamado o reanuncio y, con el sonido activado en la pantalla, anuncio por voz ("Turno RTH 4, Consultorio 502, Andrés Gómez").
- Reanuncio automático según la configuración de la IPS y cierre como "no se presentó" tras el último llamado.
- Turnos de farmacia (FAR n) en la misma pantalla.

### No incluye

- Voz con nombre completo o datos del paciente (la voz solo dice turno, lugar y nombre y primer apellido).
- Publicidad o mensajes institucionales en la pantalla.

## Criterios de aceptación

- [ ] **Dado que** se llama RTH 4 para el Consultorio 502, **cuando** miro la pantalla, **entonces** veo "RTH 4 ·
      Consultorio 502" y "Andrés Gómez", sin documento ni segundo apellido.
- [ ] **Dado que** se llamaron otros turnos antes, **cuando** miro la pantalla, **entonces** veo hasta 6 llamados
      anteriores del día.
- [ ] **Dado que** RTH 4 lleva el intervalo configurado sin respuesta y le quedan llamados, **cuando** pasa ese
      tiempo, **entonces** el sistema lo vuelve a anunciar solo.
- [ ] **Dado que** RTH 4 agotó sus llamados, **cuando** pasa el intervalo, **entonces** el sistema lo cierra como
      "no se presentó" y el historial lo marca como automático.
- [ ] **Dado que** la API corre en más de una instancia, **cuando** reanuncia, **entonces** ningún llamado se duplica.
- [ ] **Dado que** el televisor usa una cuenta del personal sin roles, **cuando** abre la pantalla, **entonces** la ve
      igual.

## Estados de error y vacíos

- Sin turnos llamados: la pantalla muestra "Esperando turnos".
- Sin conexión: la pantalla conserva el último estado y reintenta.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Revisión del reanuncio | Cada 10 s (configurable por entorno; 0 la apaga). |
| Sonido | El navegador exige una acción del usuario para reproducir audio: la pantalla trae un botón "Sonido". |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Pantalla de sala | Cualquier miembro; solo nombre y primer apellido. |
| Reanuncio | Automático y trazado como hecho por el sistema. |

## Requisitos de consistencia

Las etiquetas y lugares coinciden con la lista de turnos de la Historia 2.

## Áreas que cambia

La pantalla de sala y el historial del paciente (eventos automáticos).

## Áreas que no debe cambiar

La configuración del llamado (Historia 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Ningún documento de identidad aparece en la pantalla.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Abrir la pantalla de sala en otra ventana.
2. Llamar un turno y comprobar que aparece.
3. Esperar el intervalo y comprobar el reanuncio.
4. Esperar tras el último llamado y comprobar el cierre automático.

## Evidencia

Commit `0bfbc72`. Pruebas: `api/test/admission.e2e-spec.ts`.
