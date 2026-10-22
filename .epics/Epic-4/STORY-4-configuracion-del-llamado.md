# Historia 4: Configuración del llamado

> Como administrador de la IPS, quiero ajustar cada cuánto se reanuncia un turno y cuántas veces para adaptar el
> llamado al ritmo de mi sala de espera.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: sin configuración, la IPS usa los valores por defecto.

## Contexto

Una sala grande necesita más tiempo entre llamados que una pequeña. Esta historia permite que cada IPS ajuste el
intervalo y el número máximo de llamados que usan la pantalla de sala y el reanuncio automático.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Ver la configuración (cualquier miembro).
- Cambiar intervalo (30 a 900 s) y máximo de llamados (1 a 5) (solo administrador).

### No incluye

- Configuración distinta por servicio.

## Criterios de aceptación

- [ ] **Dado que** la IPS nunca configuró el llamado, **cuando** abro la configuración, **entonces** veo 3 llamados
      cada 2 minutos.
- [ ] **Dado que** soy administrador, **cuando** guardo 5 llamados cada 60 segundos, **entonces** el reanuncio usa los
      nuevos valores desde ese momento.
- [ ] **Dado que** escribo un intervalo de 10 segundos o 6 llamados, **cuando** guardo, **entonces** se rechaza
      indicando el rango válido.
- [ ] **Dado que** no soy administrador, **cuando** intento cambiar la configuración, **entonces** se me niega.

## Estados de error y vacíos

- Valores fuera de rango: mensaje junto al campo.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Alcance | Una configuración por IPS. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Configuración | 30-900 s, 1-5 llamados; por defecto 3 cada 2 min. |

## Requisitos de consistencia

La pantalla de sala (Historia 3) muestra y aplica estos mismos valores.

## Áreas que cambia

La configuración de la IPS (sección de llamado).

## Áreas que no debe cambiar

Los turnos ya cerrados.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Abrir la configuración y ver los valores por defecto.
2. Guardar 2 llamados cada 30 s.
3. Llamar un turno y comprobar el ritmo en la pantalla de sala.

## Evidencia

Commit `0bfbc72`. Pruebas: `api/test/admission.e2e-spec.ts`.
