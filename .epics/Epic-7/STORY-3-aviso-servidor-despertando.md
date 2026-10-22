# Historia 3: Aviso cuando el servidor está despertando

> Como integrante del personal, quiero que la aplicación me avise cuando el servidor está despertando y reintente sola
> para no pensar que el sistema falló.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

No requiere *feature flag*: solo cambia lo que se ve mientras se espera.

## Contexto

En el plan gratuito de Render la API se suspende tras unos 15 minutos sin uso y la primera petición tarda de 30 a 60
segundos. Hoy el personal ve una carga larga o un error genérico. Esta historia detecta esa espera, la explica y
reintenta sin que la persona tenga que recargar.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Aviso "El servidor se está iniciando, esto puede tardar hasta un minuto" cuando una petición tarda o falla por
  conexión.
- Reintentos automáticos de las lecturas hasta que la API responda.
- Al responder, la pantalla carga normalmente.

### No incluye

- Reintentar automáticamente acciones de escritura (registrar, agendar, entregar): se ofrece reintentar a mano para no
  duplicar.
- Mantener la API despierta artificialmente.

## Criterios de aceptación

- [ ] **Dado que** la API está dormida, **cuando** abro la lista de pacientes, **entonces** veo el aviso de que el
      servidor se está iniciando en lugar de un error.
- [ ] **Dado que** la API termina de iniciar, **cuando** responde, **entonces** la lista aparece sin que yo recargue.
- [ ] **Dado que** la API está dormida y yo intento registrar un paciente, **cuando** falla por conexión, **entonces**
      veo el aviso y un botón para reintentar, y lo escrito se conserva.
- [ ] **Dado que** la API sigue sin responder tras 2 minutos, **cuando** se agota el tiempo, **entonces** veo un error
      claro con la opción de reintentar.
- [ ] **Dado que** la API responde un error de negocio (por ejemplo, permiso denegado), **cuando** lo recibo,
      **entonces** veo ese error, no el aviso de inicio.

## Estados de error y vacíos

- Descritos en los criterios: espera, reintento y tiempo agotado.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Qué se reintenta solo | Solo lecturas. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Despliegue | Render sigue en el plan actual. |

## Áreas que cambia

El comportamiento de carga y error de todas las pantallas del tablero.

## Áreas que no debe cambiar

La pantalla de sala, que ya reintenta por su cuenta.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] No hay errores nuevos en la consola del navegador.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Dejar la API de producción sin uso 20 minutos.
2. Abrir la lista de pacientes y comprobar el aviso y la carga automática.
3. Repetir intentando registrar un paciente y usar el botón de reintentar.

## Preguntas abiertas

- ¿Vale más contratar un plan de Render sin suspensión? Si es así, esta historia se descarta.
