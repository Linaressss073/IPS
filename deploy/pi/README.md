# Despliegue en la Raspberry Pi

Producción actual: la API y la web corren en una Raspberry Pi con Docker Compose y se publican por un túnel de Cloudflare. La única base de datos es MongoDB Atlas, así que la Pi no guarda datos: se puede reconstruir desde el repositorio.

| Servicio | URL pública | Contenedor | Puerto en la Pi |
|---|---|---|---|
| Web | `https://ips.devrojas.xyz` | `b2b-web` | `127.0.0.1:3100` |
| API | `https://ips-api.devrojas.xyz/api/v1` (salud: `/health`, Swagger: `/docs`) | `b2b-api` | `127.0.0.1:3101` |
| Túnel | — | `b2b-cloudflared` (perfil `tunnel`) | sin puertos |

Los puertos solo escuchan en `127.0.0.1`: nada se expone a la red local ni a internet salvo por el túnel.

## Requisitos en la Pi

- Docker y Docker Compose, y acceso por SSH desde el equipo que despliega.
- Carpeta `~/docker/b2b` con el `.env` (copiar de [`.env.example`](.env.example), `chmod 600`). **Nunca va al repositorio.**
- MongoDB Atlas con acceso de red permitido a la IP pública de la Pi.

## Variables del `.env`

| Variable | Qué es |
|---|---|
| `CLERK_SECRET_KEY` | Secreto de Clerk (la API y la web lo leen) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Secreto de firma del webhook de Clerk |
| `MONGO_URL`, `MONGO_DB_NAME` | Conexión a Atlas |
| `CORS_ORIGIN`, `CLERK_AUTHORIZED_PARTIES` | Origen de la web: `https://ips.devrojas.xyz` |
| `MAIL_*` | Correo (Spacemail). En producción `ENV=prod` (lo fija el compose) permite cualquier destinatario; fuera de producción solo los de `MAIL_DEV_ALLOW`. El puerto 587 exige TLS en producción |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token del túnel (solo con `--profile tunnel`) |

## Desplegar

Desde la raíz del repositorio, **solo con el CI de `main` en verde** (el despliegue es manual: aquí no hay `autoDeployTrigger`):

```bash
deploy/pi/deploy.sh            # api y web
deploy/pi/deploy.sh api        # solo la API
deploy/pi/deploy.sh web        # solo la web
```

Variables opcionales: `PI` (usuario@host de la Pi), `PUBLIC_API_URL` (URL pública de la API; se hornea en la web al construirla) y `CLERK_PK` (clave pública de Clerk; si no, se lee de `multi-tenant-starter-template/.env.local`).

El script empaqueta el código sin secretos (`.env*`, `secrets.*.json`, `node_modules`), lo copia a `~/b2b-src` en la Pi, construye las imágenes `b2b-api` y `b2b-web` allí, copia el compose y recrea los contenedores.

## Túnel de Cloudflare

1. En Cloudflare Zero Trust → Networks → Tunnels, crear el túnel y copiar su token a `CLOUDFLARE_TUNNEL_TOKEN` del `.env`.
2. Añadir los hostnames públicos: `ips.devrojas.xyz` → `http://web:3000` y `ips-api.devrojas.xyz` → `http://api:3001`.
3. Arrancarlo: `docker compose --profile tunnel up -d cloudflared` (desde `~/docker/b2b`).

## Configuración en Clerk (cada vez que cambia el dominio)

- Orígenes autorizados (`CLERK_AUTHORIZED_PARTIES`) con el de la web.
- Webhook: `https://ips-api.devrojas.xyz/api/v1/webhooks/clerk`, con su *signing secret* en `CLERK_WEBHOOK_SIGNING_SECRET`.
- La web sigue usando la instancia **Development** de Clerk hasta completar IPS-151 (instancia de producción).

## Comprobar y operar

```bash
curl https://ips-api.devrojas.xyz/api/v1/health   # {"status":"ok","database":"up"}
docker ps --format '{{.Names}} {{.Status}}' | grep b2b
docker logs --tail 100 b2b-api
```

- **Volver atrás:** las imágenes llevan la etiqueta `latest`; para revertir se hace `git checkout <commit bueno>` y se vuelve a ejecutar `deploy.sh`.
- **Copias de seguridad:** los datos están en Atlas (ver [política de respaldos](../../docs/04-conservacion-y-respaldos.md)). Del `.env` de la Pi se guarda una copia en un gestor de contraseñas.
- **Logs y métricas:** si `OTEL_EXPORTER_OTLP_ENDPOINT` y `OTEL_EXPORTER_OTLP_HEADERS` están en el `.env`, la API los envía a Grafana Cloud; el token de Grafana es un secreto igual que los demás.
