# Historia 1: Servicios y consultorios

> Como administrador de la IPS, quiero definir los servicios y los lugares de atención para que agendamiento pueda
> abrir agendas y los turnos se identifiquen por servicio.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: es una pantalla de configuración nueva.

## Contexto

La consulta externa ofrece servicios (Medicina general, Rehabilitación…) en lugares concretos (Consultorio 502,
Farmacia 1). Cada servicio tiene un código corto que identifica sus turnos en la pantalla de sala. Esta historia deja
al administrador crear y mantener ese catálogo.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Crear servicio con código (2 a 4 letras) y nombre; renombrarlo y activarlo o desactivarlo.
- Crear ubicación con tipo y número; activarla o desactivarla.
- Lista de servicios y ubicaciones para quienes agendan.

### No incluye

- Tarifas o códigos CUPS de los servicios.
- Horarios de apertura de los consultorios.

## Criterios de aceptación

- [ ] **Dado que** soy administrador, **cuando** creo el servicio "rth" - Rehabilitación, **entonces** queda con
      código "RTH" y activo.
- [ ] **Dado que** ya existe el código RTH, **cuando** creo otro servicio con "rth", **entonces** el sistema indica que
      el código ya está en uso.
- [ ] **Dado que** un servicio existe, **cuando** intento cambiar su código, **entonces** el sistema no lo permite.
- [ ] **Dado que** existe "Consultorio 502", **cuando** creo "consultorio 502", **entonces** el sistema indica que la
      ubicación ya existe.
- [ ] **Dado que** desactivo un servicio, **cuando** agendamiento abre una agenda, **entonces** ese servicio no está
      disponible; las citas ya dadas se conservan.
- [ ] **Dado que** no soy administrador, **cuando** intento crear o cambiar servicios o ubicaciones, **entonces** se
      me niega.

## Estados de error y vacíos

- Sin servicios: mensaje que invita al administrador a crear el primero.
- Inactivos: se muestran marcados como inactivos, no se ocultan.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Tipo de ubicación | Texto libre de 2 a 40 caracteres (consultorio, farmacia, sala…). |
| Número de ubicación | 1 a 10 letras, dígitos o guiones. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Código del servicio | Único, en mayúsculas, inmutable. |
| Borrado | Nunca; se desactiva. |

## Áreas que cambia

La configuración de agendamiento.

## Áreas que no debe cambiar

Las agendas y citas (Historias 2 a 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Cada cambio de configuración queda trazado.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Crear los servicios MG y RTH y los consultorios 301 y 502.
2. Intentar repetir el código y la ubicación.
3. Desactivar RTH y comprobar que no aparece al abrir agendas.

## Evidencia

Commit `0da51cb`. Pruebas: `api/test/scheduling.e2e-spec.ts`.
