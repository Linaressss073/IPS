# Webhooks de Clerk

[← Índice](README.md)

```http
POST /api/v1/webhooks/clerk
```

**Lo llama Clerk**, no el frontend. No usa token de sesión: la autenticidad se comprueba con la **firma** sobre el
cuerpo crudo (formato Svix / *Standard Webhooks*). Mantiene al día el [personal](03-staff.md) y las
[organizaciones](04-organizations.md).

| Entorno | URL del endpoint |
|---|---|
| Producción | `https://ips-api-3404.onrender.com/api/v1/webhooks/clerk` |
| Local | Necesita un túnel público (p. ej. ngrok) apuntando a `http://localhost:3001` |

## Cabeceras

| Cabecera | Descripción |
|---|---|
| `svix-id` (o `webhook-id`) | Id del mensaje |
| `svix-timestamp` (o `webhook-timestamp`) | Segundos Unix del envío |
| `svix-signature` (o `webhook-signature`) | `v1,<base64(HMAC-SHA256(secreto, "<id>.<timestamp>.<cuerpo>"))>` |

El secreto es el *Signing Secret* del endpoint en Clerk (`whsec_…`), configurado en
`CLERK_WEBHOOK_SIGNING_SECRET`.

## Eventos procesados

| Evento | Efecto |
|---|---|
| `user.created`, `user.updated` | Guarda o actualiza el perfil mínimo (nombre, e-mail enmascarado). Ignora actualizaciones más viejas que lo guardado. |
| `user.deleted` | **Anonimiza** al usuario y borra sus membresías |
| `organization.created`, `organization.updated` | Crea o actualiza la ficha de la IPS en MongoDB (nombre) |
| `organization.deleted` | Marca la ficha como eliminada y borra las membresías de esa IPS |
| `organizationMembership.created`, `organizationMembership.updated` | Guarda la membresía y su rol |
| `organizationMembership.deleted` | Quita la membresía |
| Otros | Se aceptan (200) y se ignoran |

Cada cambio del personal también reconstruye su documento en la colección `staff` de MongoDB.

## Respuestas

| Código | Cuerpo | Cuándo |
|---|---|---|
| **200** | `{ "received": true }` | Evento aplicado o ignorado |
| 400 | `Invalid webhook signature` | Firma ausente, inválida o cuerpo alterado |
| 503 | `Clerk webhooks are not configured` | Falta `CLERK_WEBHOOK_SIGNING_SECRET` |
| 5xx | — | Fallo al guardar (p. ej. Mongo caído): Clerk **reintenta** el evento más tarde; aplicar el mismo evento dos veces es seguro |

En el log solo se registra el tipo de evento (`Clerk user.updated applied`), nunca su contenido.

## Carga inicial

Los webhooks solo traen los cambios **a partir de su configuración**. Para cargar lo que ya existía:

```bash
pnpm build
ENV=prod pnpm clerk:sync     # PowerShell: $env:ENV="prod"; pnpm clerk:sync
```

Carga organizaciones, usuarios y membresías y aplica las bajas pendientes. Es idempotente.

## Reconciliación automática

Además de los webhooks, la API compara con Clerk **al arrancar (a los 15 s) y cada 10 minutos**
(`CLERK_SYNC_INTERVAL_MS`, en milisegundos; `0` la apaga). Aplica lo que un webhook no alcanzó a traer:

- altas y cambios de organizaciones, usuarios y membresías;
- **bajas**: IPS que ya no están en Clerk → `status: deleted`; usuarios eliminados → anonimizados; membresías
  quitadas → la persona deja de aparecer en esa IPS.

Salvaguardas: solo da de baja datos cambiados antes de empezar la pasada (lo que un webhook agrega mientras
tanto no se toca) y, si Clerk devuelve una lista vacía, no borra nada. Las pasadas no se solapan.

Por qué no cada pocos milisegundos: cada pasada recorre todo con varias llamadas a la API de Clerk, que tiene
límite de peticiones; superarlo (429) rompería también la verificación de membresías de cada petición.

> En el plan gratuito de Render la API se duerme tras ~15 min sin tráfico: los webhooks llegan cuando despierta
> (Clerk reintenta) y la reconciliación al arrancar pone todo al día.
