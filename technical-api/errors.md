# Errores

[← Índice](README.md)

## Formatos

**Reglas de negocio** (errores de dominio): siempre traen un `code` estable, pensado para el frontend.

```json
{ "statusCode": 409, "code": "PATIENT_VERSION_CONFLICT", "message": "Patient … was modified by someone else; reload it and try again" }
```

**Forma del cuerpo** (validación de tipos y campos): sin `code`; `message` lista los problemas.

```json
{ "statusCode": 400, "message": ["contact.email must be a string", "property extra should not exist"], "error": "Bad Request" }
```

**Autenticación**:

```json
{ "statusCode": 401, "message": "Missing bearer token", "error": "Unauthorized" }
```

`message` está en inglés y es para depuración; el frontend traduce por `code`
(`multi-tenant-starter-template/components/patients/error-message.ts`).

## Catálogo

| HTTP | `code` | Significado |
|---|---|---|
| 400 | `INVALID_VALUE` | Un dato no cumple su regla (documento, nombre, e-mail, teléfono, NIT, código REPS, id…) |
| 400 | `INVALID_BIRTH_DATE` | Fecha de nacimiento futura o de hace más de 130 años |
| 400 | `INVALID_REQUESTER` | `requestedBy` no es miembro de la IPS |
| 400 | `INVALID_SLOT_MINUTES` | Duración de cupo fuera de 5-240 minutos |
| 400 | `AGENDA_END_BEFORE_START` | La hora de fin de la agenda no es posterior a la de inicio |
| 400 | `AGENDA_SLOTS_NOT_WHOLE` | El bloque no se divide en cupos completos; el mensaje sugiere la hora de fin |
| 400 | `SCHEDULE_IN_THE_PAST` | Agenda o cita en el pasado |
| 400 | `SLOT_NOT_IN_AGENDA` | La hora no es un cupo de la agenda |
| 400 | `NOT_A_PROFESSIONAL` | La persona no tiene el rol médico en la IPS |
| 400 | `INACTIVE_RESOURCE` | El servicio o la ubicación están inactivos |
| 400 | `RESCHEDULE_SERVICE_MISMATCH` | Se intentó mover la cita a una agenda de otro servicio |
| 400 | `APPOINTMENT_NOT_TODAY` | Se intentó registrar la llegada de una cita de otro día |
| 401 | `INVALID_ACCESS_TOKEN` | Token de sesión inválido o vencido |
| 400 | *(sin code)* | Forma del cuerpo inválida o campo desconocido |
| 400 | *(sin code)* | `Invalid webhook signature` |
| 401 | — | Sin token, token inválido, vencido o emitido para otro origen |
| 403 | `NOT_A_TEAM_MEMBER` | Quien llama no pertenece a la IPS de la ruta |
| 403 | `TEAM_ADMIN_REQUIRED` | La acción es solo para administradores de la IPS |
| 403 | `PERMISSION_DENIED` | Los roles de quien llama en la IPS no incluyen el permiso que exige el endpoint |
| 404 | `PATIENT_NOT_FOUND` | El paciente no existe en esa IPS |
| 404 | `ORGANIZATION_NOT_FOUND` | La IPS no existe o fue eliminada |
| 404 | `STAFF_MEMBER_NOT_FOUND` | Se intentó asignar roles a alguien que no pertenece a la IPS |
| 404 | `SERVICE_NOT_FOUND` · `LOCATION_NOT_FOUND` · `AGENDA_NOT_FOUND` · `APPOINTMENT_NOT_FOUND` | No existe en esa IPS |
| 409 | `DOCUMENT_ALREADY_REGISTERED` | Ya hay un paciente con ese tipo y número de documento en la IPS |
| 409 | `PATIENT_VERSION_CONFLICT` | El paciente cambió desde que el cliente lo leyó |
| 409 | `ORGANIZATION_VERSION_CONFLICT` | La IPS cambió desde que el cliente la leyó |
| 409 | `APPOINTMENT_VERSION_CONFLICT` | La cita cambió desde que el cliente la leyó |
| 409 | `SERVICE_CODE_TAKEN` | Otro servicio de la IPS ya usa ese prefijo |
| 409 | `LOCATION_TAKEN` | Ya existe esa ubicación (tipo + número) |
| 409 | `AGENDA_OVERLAP` | El profesional o la ubicación ya tienen una agenda que se cruza |
| 409 | `AGENDA_HAS_APPOINTMENTS` | Se intentó eliminar una agenda con citas activas |
| 409 | `SLOT_TAKEN` | Otra persona tomó el cupo |
| 409 | `PATIENT_ALREADY_BOOKED` | El paciente ya tiene una cita a esa hora |
| 409 | `INVALID_APPOINTMENT_TRANSITION` | El estado de la cita no permite esa acción |
| 404 | `TURN_NOT_FOUND` | El turno no existe en esa IPS |
| 409 | `ALREADY_CHECKED_IN` | La cita ya tiene turno |
| 409 | `APPOINTMENT_NOT_ADMISSIBLE` | La cita está cancelada |
| 409 | `INVALID_TURN_TRANSITION` | El turno ya está cerrado |
| 409 | `MAX_CALLS_REACHED` | El turno ya se llamó el máximo de veces |
| 409 | `TURN_VERSION_CONFLICT` | El turno cambió (otro llamado o un reanuncio automático) |
| 400 | `CONSULTATION_INCOMPLETE` | Para firmar falta el motivo o el diagnóstico principal |
| 403 | `NOT_THE_TREATING_PHYSICIAN` | Solo el médico de la cita escribe su consulta |
| 404 | `CONSULTATION_NOT_FOUND` | La consulta no existe en esa IPS |
| 409 | `APPOINTMENT_NOT_ATTENDABLE` | La cita está cancelada o es de un día futuro |
| 409 | `CONSULTATION_SIGNED` | La consulta firmada no se modifica (usar nota aclaratoria) |
| 409 | `CONSULTATION_NOT_SIGNED` | Las notas aclaratorias van en consultas firmadas |
| 409 | `CONSULTATION_VERSION_CONFLICT` | La consulta cambió desde que se leyó |
| 400 | `OVER_DELIVERY` | Se intentó entregar más de lo pendiente |
| 404 | `PRESCRIPTION_NOT_FOUND` | La consulta no está firmada o no tiene medicamentos |
| 404 | `WINDOW_NOT_FOUND` | Ventanilla de farmacia desconocida o inactiva |
| 409 | `NOTHING_PENDING` | La fórmula ya se entregó completa |
| 409 | `ALREADY_DISPENSED` | No se da turno a una fórmula ya entregada |
| 409 | `DISPENSATION_VERSION_CONFLICT` | Otra entrega se registró antes |
| 400 | `EXPIRED_LOT` | Se intentó recibir un lote ya vencido |
| 400 | `INACTIVE_PRODUCT` | Se intentó dispensar un producto inactivo |
| 404 | `PRODUCT_NOT_FOUND` | Producto desconocido en el inventario |
| 404 | `LOT_NOT_FOUND` | Lote desconocido en ese producto |
| 409 | `PRODUCT_TAKEN` | Ya existe un producto con ese nombre y presentación |
| 409 | `LOT_EXPIRY_MISMATCH` | El lote ya se recibió con otro vencimiento |
| 409 | `INSUFFICIENT_STOCK` | No hay existencias no vencidas suficientes |
| 409 | `NEGATIVE_STOCK` | El ajuste dejaría el lote en negativo |
| 409 | `STOCK_CHANGED` | Las existencias cambiaron mientras tanto; reintentar |
| 503 | — | Base de datos caída (`/health`), MongoDB no configurado para organizaciones, o webhooks sin configurar |

## Cómo reaccionar

| Situación | Qué hacer en el cliente |
|---|---|
| 401 | Renovar la sesión (`getToken()`) o volver a iniciar sesión |
| 403 `NOT_A_TEAM_MEMBER` | Volver a "Elige tu IPS" |
| 403 `PERMISSION_DENIED` | Ocultar la acción (consultar `GET /staff/me`) y sugerir pedir el rol a un administrador |
| 409 `*_VERSION_CONFLICT` | Recargar el recurso y pedir al usuario que repita su cambio |
| 409 `DOCUMENT_ALREADY_REGISTERED` | Buscar al paciente existente en vez de crear otro |
| 409 `SLOT_TAKEN` | Recargar la agenda del día y elegir otro cupo |
| 503 | Reintentar más tarde |
