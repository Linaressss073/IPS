# Épica 8: Comunicación con el paciente

## Objetivo

Avisar al paciente por correo cuando se le agenda, reprograma o cancela una cita, y recordarle su cita el día
anterior, siempre que haya autorizado esas comunicaciones. El correo del paciente ya es obligatorio en su registro
(Épica 2), pero hoy no se usa; la inasistencia (que la Épica 4 ya registra como "no se presentó") es justamente lo que
los recordatorios buscan reducir.

**Estado:** propuesta, pendiente de aprobación.

## Documentos de referencia

- `technical-api/02-patients.md` (contacto del paciente), `06-scheduling.md` (estados de la cita).
- Ley 1581 de 2012 y Decreto 1377 de 2013 (autorización para el tratamiento de datos personales).

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Canal | Correo electrónico (el único dato de contacto obligatorio hoy). SMS o WhatsApp quedan fuera. |
| Autorización | Sin autorización registrada no se envía nada; la autorización y su retiro quedan en el historial. |
| Contenido | Fecha, hora, servicio, lugar y nombre de la IPS; nunca diagnósticos ni datos clínicos. |
| Fallos de envío | No bloquean la operación (agendar sigue funcionando aunque el correo falle); el fallo queda registrado. |
| Desarrollo y pruebas | **Mailtrap Email Sandbox** (recomendado el 21-oct-2026): atrapa todos los correos en una bandeja de pruebas y nunca los entrega a pacientes reales. Las pruebas automáticas no envían nada: verifican el mensaje generado sin red. |
| Producción | Proveedor por definir; el envío queda detrás de un adaptador para cambiar de proveedor sin tocar las historias. |

## Orden de las historias

### Historia 1: Autorización de comunicaciones del paciente

**Prioridad**: sin autorización no se puede enviar ningún correo.
Al registrar o editar al paciente se marca si autoriza recibir comunicaciones; el cambio queda trazado.
**Dependencias**: Épica 2.

### Historia 2: Correo al agendar, reprogramar o cancelar

**Prioridad**: es el primer aviso útil para el paciente.
Cada vez que su cita se agenda, reprograma o cancela, el paciente que autorizó recibe un correo con los datos.
**Dependencias**: Historia 1, Épica 3.

### Historia 3: Recordatorio el día anterior

**Prioridad**: ataca directamente la inasistencia.
El sistema envía cada día los recordatorios de las citas del día siguiente.
**Dependencias**: Historia 2.

## Contexto compartido para el detalle de historias

- **Pacientes:** `api/src/contexts/patients/` (`patient.entity.ts`, `register-patient.command.ts`,
  `update-patient.command.ts`), formulario en `app/dashboard/[teamId]/patients/new` y la ficha del paciente.
- **Citas:** `api/src/contexts/scheduling/application/commands/` (`schedule-appointment`, `reschedule-appointment`,
  `cancel-appointment`).
- **Datos de la IPS para el correo:** `api/src/contexts/organizations/`.
- **Tareas periódicas existentes (patrón a seguir):** el reanuncio de turnos en `api/src/contexts/admission/` y la
  reconciliación en `api/src/integrations/clerk/clerk-reconciler.ts`.
- **Configuración:** `api/deployment/config.json`, `api/src/config/env.ts`, `render.yaml` (secretos con `sync: false`).
- **Skill disponible:** `node-mail-module` (Nodemailer + plantillas + guarda de Mailtrap Sandbox).

## Preguntas abiertas

1. ¿Qué proveedor de correo se usa en producción? En evaluación; no bloquea las historias, que se construyen y prueban
   con Mailtrap Sandbox.
2. ¿Los pacientes ya registrados se consideran sin autorización hasta que se les pregunte? (Propuesta: sí.)
3. ¿A qué hora se envían los recordatorios? (Propuesta: 08:00 hora de Colombia.)
