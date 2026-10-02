# Organizaciones (IPS)

[← Índice](README.md)

Ficha de cada IPS en la colección **`organizations` de MongoDB**. Clerk es el dueño del acceso (quién entra) y del
nombre; esta ficha agrega los datos propios de una IPS colombiana. `:teamId` es el id de la organización en Clerk
(`org_…`).

- [Ver IPS](#ver-ips)
- [Actualizar IPS](#actualizar-ips)
- [Eliminar IPS](#eliminar-ips)
- [Modelo](#organizationview)

---

## Ver IPS

```http
GET /api/v1/organizations/:teamId
```

**Acceso:** miembros de la IPS.

Si la IPS aún no está en MongoDB (por ejemplo, se creó antes de configurar los webhooks), se **importa desde Clerk** la
primera vez que se consulta.

| Código | Cuándo |
|---|---|
| **200** | [`OrganizationView`](#organizationview) |
| 403 | `NOT_A_TEAM_MEMBER` |
| 404 | `ORGANIZATION_NOT_FOUND` (no existe o fue eliminada) |
| 503 | MongoDB no configurado (`MONGO_URL`) |

---

## Actualizar IPS

```http
PATCH /api/v1/organizations/:teamId
```

**Acceso:** solo **administradores** de la IPS (403 `TEAM_ADMIN_REQUIRED` para miembros).

```json
{
  "version": 2,
  "name": "IPS Alfa Sur",
  "nit": "890.903.938-8",
  "habilitationCode": "110010000001",
  "address": "Calle 10 # 5-20",
  "city": "Bogotá",
  "department": "Cundinamarca",
  "phone": "601 555 1234",
  "email": "contacto@ipsalfa.co"
}
```

| Campo | Obligatorio | Reglas |
|---|---|---|
| `version` | **Sí** | La versión que leyó el cliente (bloqueo optimista) |
| `name` | No | 2-80 caracteres. **También se cambia en Clerk**, para que el login muestre el mismo nombre. |
| `nit` | No | Base de 6-10 dígitos + **dígito de verificación DIAN** (`890903938-8`); se aceptan puntos. Se rechaza si el dígito no coincide. |
| `habilitationCode` | No | Código de habilitación del REPS: 10-12 dígitos |
| `address` | No | Hasta 200 caracteres |
| `city`, `department` | No | Hasta 60 caracteres |
| `phone` | No | 7-15 dígitos, opcionalmente con `+` |
| `email` | No | Correo institucional válido (se guarda en minúsculas) |

- Los campos **no enviados** no cambian; **`null`** borra un campo opcional.
- Si nada cambia, no se guarda y la versión se mantiene.

| Código | Cuándo |
|---|---|
| **200** | [`OrganizationView`](#organizationview) actualizado (`version` + 1) |
| 400 | `INVALID_VALUE` (NIT, código REPS, teléfono, e-mail…) o forma inválida |
| 403 | `TEAM_ADMIN_REQUIRED` |
| 409 | `ORGANIZATION_VERSION_CONFLICT` |

---

## Eliminar IPS

```http
DELETE /api/v1/organizations/:teamId
```

**Acceso:** solo **administradores**. **Irreversible.**

1. Elimina la organización en **Clerk**: se borran todas sus membresías y **nadie puede volver a entrar**.
2. Deja la ficha en MongoDB como **lápida** (`status: "deleted"`, `deletedAt`, `deletedBy`).
3. **No borra pacientes, historial ni acompañantes**: la historia clínica debe conservarse por ley; quedan en las
   bases de datos aunque ya no sean accesibles desde la aplicación.

| Código | Cuándo |
|---|---|
| **204** | Eliminada (sin cuerpo) |
| 403 | `TEAM_ADMIN_REQUIRED` |
| 404 | `ORGANIZATION_NOT_FOUND` |

---

## OrganizationView

```json
{
  "id": "org_2xTeamA9fKq4LmN8pRsT1uVwY",
  "name": "IPS Alfa Sur",
  "nit": "890903938-8",
  "habilitationCode": "110010000001",
  "address": "Calle 10 # 5-20",
  "city": "Bogotá",
  "department": "Cundinamarca",
  "phone": "6015551234",
  "email": "contacto@ipsalfa.co",
  "status": "active",
  "version": 3,
  "createdAt": "2026-10-02T07:09:33.596Z",
  "updatedAt": "2026-10-02T08:15:00.000Z"
}
```

## Documento en MongoDB (`organizations`)

```json
{
  "_id": "org_…",
  "name": "IPS Alfa Sur",
  "profile": { "nit": "890903938-8", "habilitationCode": "110010000001", "address": null, "city": "Bogotá",
               "department": null, "phone": null, "email": "contacto@ipsalfa.co" },
  "status": "active",
  "providerUpdatedAt": "…",
  "createdAt": "…",
  "updatedAt": "…",
  "version": 3,
  "deletedAt": null,
  "deletedBy": null
}
```

Los cambios hechos directamente en Clerk (`organization.created/updated/deleted`) llegan por
[webhooks](05-webhooks.md); un cambio más viejo que lo guardado se ignora.
