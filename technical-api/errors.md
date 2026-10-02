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
| 400 | *(sin code)* | Forma del cuerpo inválida o campo desconocido |
| 400 | *(sin code)* | `Invalid webhook signature` |
| 401 | — | Sin token, token inválido, vencido o emitido para otro origen |
| 403 | `NOT_A_TEAM_MEMBER` | Quien llama no pertenece a la IPS de la ruta |
| 403 | `TEAM_ADMIN_REQUIRED` | La acción es solo para administradores de la IPS |
| 403 | `PERMISSION_DENIED` | Los roles de quien llama en la IPS no incluyen el permiso que exige el endpoint |
| 404 | `PATIENT_NOT_FOUND` | El paciente no existe en esa IPS |
| 404 | `ORGANIZATION_NOT_FOUND` | La IPS no existe o fue eliminada |
| 404 | `STAFF_MEMBER_NOT_FOUND` | Se intentó asignar roles a alguien que no pertenece a la IPS |
| 409 | `DOCUMENT_ALREADY_REGISTERED` | Ya hay un paciente con ese tipo y número de documento en la IPS |
| 409 | `PATIENT_VERSION_CONFLICT` | El paciente cambió desde que el cliente lo leyó |
| 409 | `ORGANIZATION_VERSION_CONFLICT` | La IPS cambió desde que el cliente la leyó |
| 503 | — | Base de datos caída (`/health`), MongoDB no configurado para organizaciones, o webhooks sin configurar |

## Cómo reaccionar

| Situación | Qué hacer en el cliente |
|---|---|
| 401 | Renovar la sesión (`getToken()`) o volver a iniciar sesión |
| 403 `NOT_A_TEAM_MEMBER` | Volver a "Elige tu IPS" |
| 403 `PERMISSION_DENIED` | Ocultar la acción (consultar `GET /staff/me`) y sugerir pedir el rol a un administrador |
| 409 `*_VERSION_CONFLICT` | Recargar el recurso y pedir al usuario que repita su cambio |
| 409 `DOCUMENT_ALREADY_REGISTERED` | Buscar al paciente existente en vez de crear otro |
| 503 | Reintentar más tarde |
