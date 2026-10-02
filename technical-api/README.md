# Documentación técnica de la API

API REST del **Sistema de Información Hospitalaria para la Consulta Externa** (NestJS · MongoDB · Clerk).
Esta carpeta documenta todos los endpoints disponibles; el código fuente está en [`../api`](../api).

| Documento | Contenido |
|---|---|
| [01-health.md](01-health.md) | Estado del servicio |
| [02-patients.md](02-patients.md) | Pacientes, historial (timeline) y acompañantes |
| [03-staff.md](03-staff.md) | Personal de la IPS (directorio ofuscado) |
| [04-organizations.md](04-organizations.md) | Datos de la IPS (colección `organizations` de MongoDB) |
| [05-webhooks.md](05-webhooks.md) | Webhooks de Clerk |
| [errors.md](errors.md) | Formato de errores y catálogo de códigos |
| [requests.http](requests.http) | Colección de peticiones lista para ejecutar (VS Code REST Client / IntelliJ) |

## URL base

Todas las rutas cuelgan del prefijo **`/api/v1`**.

| Entorno | URL base |
|---|---|
| Local (`ENV=dev`) | `http://localhost:3001/api/v1` |
| Producción (Render, `ENV=prod`) | `https://ips-api-3404.onrender.com/api/v1` |

> En el plan gratuito de Render el servicio se duerme tras ~15 min sin uso: la primera petición puede tardar 30-60 s.

## Resumen de endpoints

| Método | Ruta | Acceso (permiso) | Respuesta | Documento |
|---|---|---|---|---|
| GET | `/health` | Público | 200 · 503 | [Health](01-health.md) |
| POST | `/teams/:teamId/patients` | `patients:write` | 201 | [Pacientes](02-patients.md#registrar-paciente) |
| GET | `/teams/:teamId/patients` | `patients:read` | 200 | [Pacientes](02-patients.md#buscar-pacientes) |
| GET | `/teams/:teamId/patients/:patientId` | `patients:read` | 200 | [Pacientes](02-patients.md#ver-paciente) |
| PATCH | `/teams/:teamId/patients/:patientId` | `patients:write` | 200 | [Pacientes](02-patients.md#actualizar-paciente) |
| GET | `/teams/:teamId/patients/:patientId/timeline` | `patients:read` | 200 | [Pacientes](02-patients.md#historial-del-paciente-timeline) |
| POST | `/teams/:teamId/patients/:patientId/companions` | `patients:write` | 201 | [Pacientes](02-patients.md#registrar-acompañante) |
| GET | `/teams/:teamId/patients/:patientId/companions` | `patients:read` | 200 | [Pacientes](02-patients.md#historial-de-acompañantes) |
| GET | `/teams/:teamId/staff` | Miembro | 200 | [Personal](03-staff.md#listar-el-personal) |
| GET | `/teams/:teamId/staff/me` | Miembro | 200 | [Personal](03-staff.md#mi-acceso) |
| PUT | `/teams/:teamId/staff/:userId/roles` | `staff:manage` | 200 | [Personal](03-staff.md#asignar-roles) |
| GET | `/organizations/:teamId` | Miembro | 200 | [Organizaciones](04-organizations.md#ver-ips) |
| PATCH | `/organizations/:teamId` | **Administrador** | 200 | [Organizaciones](04-organizations.md#actualizar-ips) |
| DELETE | `/organizations/:teamId` | **Administrador** | 204 | [Organizaciones](04-organizations.md#eliminar-ips) |
| POST | `/webhooks/clerk` | Clerk (firma) | 200 | [Webhooks](05-webhooks.md) |

## Autenticación

Todas las rutas, salvo `/health` y `/webhooks/clerk`, exigen el **token de sesión de Clerk**:

```http
Authorization: Bearer <token de sesión de Clerk>
```

En el frontend se obtiene con `useAuth().getToken()` (ver `multi-tenant-starter-template/lib/api/use-api-auth.ts`).
La API valida la firma del token contra Clerk y que haya sido emitido para el frontend autorizado (`azp`).

## Multi-tenancy (IPS)

- Cada **IPS** es una *organización* de Clerk; su id (`org_…`) es el **`:teamId`** de las rutas.
- Toda ruta con `:teamId` verifica que quien llama **pertenece a esa IPS** (403 `NOT_A_TEAM_MEMBER` si no).
  Si la IPS es la organización activa del token, no se consulta a Clerk.
- Los datos de una IPS **nunca** son visibles desde otra: un recurso de otra IPS responde 404.
- **Administrador**: el rol `admin` de Clerk. `PATCH` y `DELETE` de la IPS exigen administrador (403 `TEAM_ADMIN_REQUIRED`).
- **Roles funcionales** (los asigna un administrador; una persona puede tener varios) y los **permisos** que dan.
  Un endpoint marcado con un permiso responde 403 `PERMISSION_DENIED` si los roles de quien llama no lo incluyen:

| Permiso | Administrador | Agendamiento | Admisión | Médico | Farmacia | Soporte |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `patients:read` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `patients:write` | ✓ | ✓ | ✓ | | | |
| `appointments:manage` | ✓ | ✓ | | | | |
| `admission:manage` | ✓ | | ✓ | | | |
| `turns:call` | | | ✓ | ✓ | ✓ | |
| `settings:manage` | ✓ | | | | | |
| `staff:manage` | ✓ | | | | | |

`appointments:manage`, `admission:manage`, `turns:call` y `settings:manage` quedan definidos para los módulos de
agendamiento, admisión y turnos.

## Convenciones

| Tema | Regla |
|---|---|
| Formato | JSON (`Content-Type: application/json`), fechas ISO 8601 en UTC (`2026-10-02T07:09:33.596Z`), fechas de calendario como `YYYY-MM-DD`. |
| Validación de forma | Campos desconocidos o de tipo incorrecto → 400 (sin `code`). |
| Reglas de negocio | Las valida el dominio y responde con un `code` legible por máquina ([errores](errors.md)). |
| Bloqueo optimista | `PATCH` de pacientes e IPS exige `version` (la que leyó el cliente). Si alguien guardó antes → 409. |
| Trazabilidad | Los cambios de pacientes guardan `requestedBy` (quién lo pidió, por defecto quien llama) y `executedBy` (quien llama). Los nombres se resuelven al leer y respetan la anonimización. |
| Datos personales del personal | Solo nombre y **e-mail enmascarado** (`and****@cli***.c**`); nunca el e-mail completo. |
| Paginación | `page` (desde 1) y `pageSize` (1-100, por defecto 20); la respuesta trae `total`. |
| CQRS | Los comandos (`POST`/`PATCH`/`PUT`/`DELETE`) guardan el cambio y su evento de trazabilidad en una transacción de MongoDB; las consultas leen los documentos directamente. El historial refleja cada cambio al instante. |
