# Historia 3: Recordatorio el día anterior

> Como paciente, quiero recibir un recordatorio el día antes de mi cita para no olvidarla.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

Usa el mismo interruptor por entorno de la Historia 2.

## Contexto

Las inasistencias desperdician cupos que otro paciente necesitaba. Esta historia envía cada día, a una hora fija, un
recordatorio a los pacientes con cita al día siguiente que autorizaron comunicaciones.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Envío diario a hora fija (hora de Colombia) de los recordatorios de las citas agendadas o confirmadas del día
  siguiente.
- Un solo recordatorio por cita, aunque la API corra en varias instancias o se reinicie.
- Registro del envío en el historial del paciente.

### No incluye

- Recordatorios configurables por IPS (horas antes, varios recordatorios).
- Confirmación desde el correo.

## Criterios de aceptación

- [ ] **Dado que** un paciente autorizado tiene cita mañana, **cuando** llega la hora del envío, **entonces** recibe un
      recordatorio con fecha, hora, servicio y lugar.
- [ ] **Dado que** la cita de mañana fue cancelada, **cuando** llega la hora del envío, **entonces** no se envía.
- [ ] **Dado que** la cita se reprogramó para mañana después del envío, **cuando** se reprograma, **entonces** el
      paciente recibe el correo de reprogramación de la Historia 2 y no un recordatorio duplicado.
- [ ] **Dado que** la API se reinicia o corre en dos instancias, **cuando** llega la hora del envío, **entonces** cada
      cita recibe un solo recordatorio.
- [ ] **Dado que** el paciente no autorizó comunicaciones, **cuando** llega la hora del envío, **entonces** no recibe
      nada.

## Estados de error y vacíos

- Envíos fallidos: quedan en el historial del paciente como en la Historia 2.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Hora | Propuesta: 08:00 hora de Colombia, configurable por entorno. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Autorización | Sin autorización no se envía. |

## Requisitos de consistencia

El recordatorio usa la misma plantilla y datos que los correos de la Historia 2.

## Áreas que cambia

Una tarea periódica nueva y el historial del paciente.

## Áreas que no debe cambiar

Agendamiento y admisión.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] La no duplicación está cubierta por una prueba automática.

## Pasos de verificación

1. Agendar dos citas para mañana (una de un paciente sin autorización) y cancelar una tercera.
2. Adelantar la hora del envío en desarrollo.
3. Comprobar en la bandeja de Mailtrap Sandbox que solo llegó un recordatorio.

## Preguntas abiertas

- Hora del envío y si debe poder configurarse por IPS.
