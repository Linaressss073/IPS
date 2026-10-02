# Personal de la IPS

[← Índice](README.md)

Directorio **mínimo y ofuscado** de quienes trabajan en cada IPS, sincronizado con Clerk por
[webhooks](05-webhooks.md) y por el script `pnpm clerk:sync`. Se guarda en la colección `staff` de MongoDB.

## Listar el personal

```http
GET /api/v1/teams/:teamId/staff
```

**Acceso:** miembros de la IPS (403 `NOT_A_TEAM_MEMBER` para el resto).

**200 OK**, ordenado por nombre; los usuarios anonimizados no aparecen:

```json
[
  {
    "userId": "user_2abc…",
    "displayName": "Alicia Gómez",
    "emailMasked": "ali****@cli***.c**",
    "providerRole": "org:admin",
    "roles": ["admision"]
  }
]
```

| Campo | Descripción |
|---|---|
| `userId` | Id del usuario en Clerk (seudónimo) |
| `displayName` | Nombre y apellido; si no hay, el nombre de usuario; si no, `null` |
| `emailMasked` | E-mail enmascarado: 3 letras del usuario, 3 del dominio y 1 de la terminación, con máscaras de largo fijo |
| `providerRole` | Rol en Clerk: `org:admin`, `org:member` |
| `roles` | Roles funcionales: `agendamiento`, `admision`, `medico`, `farmacia`, `soporte` |

## Mi acceso

```http
GET /api/v1/teams/:teamId/staff/me
```

**Acceso:** cualquier miembro. Devuelve qué puede hacer quien llama; el frontend lo usa para mostrar solo esas
acciones (la API exige lo mismo en cada petición).

```json
{
  "userId": "user_2abc…",
  "isAdmin": false,
  "roles": ["admision"],
  "permissions": ["patients:read", "patients:write", "admission:manage", "turns:call"]
}
```

## Asignar roles

```http
PUT /api/v1/teams/:teamId/staff/:userId/roles
```

**Acceso:** permiso `staff:manage` (administradores). El cuerpo trae **el conjunto completo** de roles; `[]` los quita
todos.

```json
{ "roles": ["agendamiento", "admision"] }
```

- Roles válidos: `agendamiento`, `admision`, `medico`, `farmacia`, `soporte` (sin distinguir mayúsculas). Los
  administradores no son un rol de esta lista: vienen de Clerk.
- La persona debe pertenecer a la IPS en Clerk; si aún no estaba en el directorio, se agrega.
- Cada cambio queda en la trazabilidad (colección `trace_events`, tipo `staff.roles_assigned`): quién lo hizo, a quién y
  los roles antes y después. Asignar los mismos roles no genera evento.

| Código | Cuándo |
|---|---|
| **200** | Miembro con sus roles (mismo formato que la lista) |
| 400 | `INVALID_VALUE` (rol desconocido) o forma inválida |
| 403 | `PERMISSION_DENIED` |
| 404 | `STAFF_MEMBER_NOT_FOUND` (no pertenece a la IPS) |

## Privacidad (Ley 1581 de 2012)

- Se guarda **solo** id, nombre y e-mail enmascarado. Nunca el e-mail completo, teléfono, foto ni contraseña.
- Si el usuario se elimina en Clerk, se **anonimiza**: nombre y e-mail pasan a `null`, se borran sus membresías y el
  historial de pacientes lo muestra como `"Usuario eliminado"`. Una actualización vieja que llegue tarde no lo revive.
- Los nombres no se copian a los eventos de trazabilidad: se resuelven al leer, así la anonimización aplica a todo el
  historial a la vez.

## Colección `staff`

Un documento por usuario (se puede consultar desde Atlas):

```json
{
  "_id": "user_2abc…",
  "displayName": "Alicia Gómez",
  "emailMasked": "ali****@cli***.c**",
  "deleted": false,
  "deletedAt": null,
  "teams": [
    {
      "teamId": "org_…",
      "providerRole": "org:admin",
      "roles": ["admision"],
      "sourceUpdatedAt": "2026-10-02T07:09:33.656Z"
    }
  ],
  "sourceUpdatedAt": "2026-10-02T07:09:33.656Z"
}
```

Índice: `teams.teamId`.
