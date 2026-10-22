# Historia 2: Correo al agendar, reprogramar o cancelar

> Como paciente, quiero recibir un correo cada vez que se agenda, cambia o cancela mi cita para saber con certeza
> cuándo y dónde debo presentarme.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

Sí conviene un interruptor por entorno: los correos solo salen en producción cuando el proveedor esté configurado; en
desarrollo y pruebas van a una bandeja de pruebas.

## Contexto

Hoy el paciente se entera de su cita solo por lo que le dicen en ventanilla o por teléfono. Esta historia le envía un
correo con los datos de la cita en cada cambio, si autorizó las comunicaciones (Historia 1).

## Entregabilidad

Completa: si el correo falla, la cita se agenda igual.

## Alcance

### Incluye

- Correo al agendar, reprogramar (con la hora anterior y la nueva) y cancelar (con el motivo).
- Datos: nombre del paciente, fecha, hora, servicio, lugar, médico y nombre y contacto de la IPS.
- Registro de cada envío (enviado o fallido) visible en el historial del paciente.

### No incluye

- Confirmar o cancelar la cita desde el correo.
- Correos por otros eventos (turnos, consulta, farmacia).

## Criterios de aceptación

- [ ] **Dado que** el paciente autorizó comunicaciones, **cuando** le agendo una cita, **entonces** recibe un correo
      con fecha, hora, servicio, lugar, médico y datos de la IPS.
- [ ] **Dado que** reprogramo su cita, **cuando** guardo, **entonces** recibe un correo con la hora anterior y la nueva.
- [ ] **Dado que** cancelo su cita, **cuando** guardo, **entonces** recibe un correo con el motivo.
- [ ] **Dado que** el paciente no autorizó o no respondió, **cuando** agendo, **entonces** no se envía nada.
- [ ] **Dado que** el proveedor de correo falla, **cuando** agendo, **entonces** la cita queda agendada y el historial
      registra el envío fallido.
- [ ] **Dado que** estoy en desarrollo, **cuando** se envía un correo, **entonces** llega a la bandeja de Mailtrap
      Sandbox y nunca a un paciente real.
- [ ] **Dado que** la configuración de desarrollo apunta por error a un servidor de correo real, **cuando** arranca la
      API, **entonces** se niega a arrancar y explica por qué.
- [ ] **Dado que** el paciente abre el correo, **cuando** lo lee, **entonces** no encuentra ningún dato clínico.

## Estados de error y vacíos

- Envío fallido: visible en el historial del paciente para que admisión le avise por otro medio.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Momento del envío | Después de guardar la cita; nunca dentro de la misma transacción. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Canal | Correo. |
| Contenido | Sin datos clínicos. |
| Fallos | No bloquean la operación. |

## Requisitos de consistencia

Los datos del correo coinciden con los que muestra la cita (servicio y lugar copiados al agendar).

## Áreas que cambia

Agendar, reprogramar y cancelar (efecto posterior) y el historial del paciente.

## Áreas que no debe cambiar

Las reglas de agendamiento.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Hay pruebas que verifican el contenido del correo sin enviarlo de verdad.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Con un paciente autorizado, agendar, reprogramar y cancelar una cita.
2. Revisar los tres correos en la bandeja de Mailtrap Sandbox.
3. Repetir con un paciente sin autorización y comprobar que no llega nada.

## Preguntas abiertas

- Proveedor de correo de producción (en evaluación) y dirección remitente. Desarrollo: Mailtrap Sandbox.
