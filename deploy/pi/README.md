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

Variables opcionales: `PI` (usuario@host de la Pi), `PUBLIC_API_URL` (URL pública de la API; se hornea en la web al construirla) y `CLERK_PK` (clave pública de Clerk de **producción**, `pk_live_…`; nunca la de `.env.local`).

El script empaqueta el código sin secretos (`.env*`, `secrets.*.json`, `node_modules`), lo copia a `~/b2b-src` en la Pi, construye las imágenes `b2b-api` y `b2b-web` allí, copia el compose y recrea los contenedores.

## Túnel de Cloudflare

1. En Cloudflare Zero Trust → Networks → Tunnels, crear el túnel y copiar su token a `CLOUDFLARE_TUNNEL_TOKEN` del `.env`.
2. Añadir los hostnames públicos: `ips.devrojas.xyz` → `http://web:3000` y `ips-api.devrojas.xyz` → `http://api:3001`.
3. Arrancarlo: `docker compose --profile tunnel up -d cloudflared` (desde `~/docker/b2b`).

## Configuración en Clerk (cada vez que cambia el dominio)

- Orígenes autorizados (`CLERK_AUTHORIZED_PARTIES`) con el de la web.
- Webhook: `https://ips-api.devrojas.xyz/api/v1/webhooks/clerk`, con su *signing secret* en `CLERK_WEBHOOK_SIGNING_SECRET`.
- La web usa la instancia de **producción** de Clerk (`clerk.devrojas.xyz`, clave pública `pk_live_…`, que `deploy.sh` trae por defecto), y el secreto del `.env` de la Pi es el de **esa misma instancia**. Si la clave pública y el secreto fueran de instancias distintas, el inicio de sesión da 500 (pasó el 18-nov-2026 al desplegar con la clave de desarrollo; `deploy.sh` ya aborta si recibe una `pk_test_…`). La instancia Development, donde está la organización DEV, es solo para trabajo local.

## Pruebas después de desplegar

```bash
bash deploy/pi/smoke-test.sh [API_URL] [WEB_URL]   # por defecto, los dominios de producción
```

28 comprobaciones de **solo lectura** (sin token ni datos reales): salud, cabeceras de seguridad de la API y de la web, 401 sin sesión en rutas protegidas, formato de errores sin trazas, webhook de Clerk sin firma, CORS (origen propio sí, ajeno no), redirección del tablero a `/sign-in` sin sesión, clave de Clerk de producción en la web, redirección a HTTPS y TLS. Además envía 12 peticiones a `/health` (una por segundo) para que Grafana tenga datos. Termina con código 1 si algo falla. Necesita `curl` y `openssl`. No provoca el 429 (eso lo cubren las pruebas e2e).

## Comprobar y operar

```bash
curl https://ips-api.devrojas.xyz/api/v1/health   # {"status":"ok","database":"up"}
docker ps --format '{{.Names}} {{.Status}}' | grep b2b
docker logs --tail 100 b2b-api
```

- **Volver atrás:** las imágenes llevan la etiqueta `latest`; para revertir se hace `git checkout <commit bueno>` y se vuelve a ejecutar `deploy.sh`.
- **Copias de seguridad:** los datos están en Atlas (ver [política de respaldos](../../docs/04-conservacion-y-respaldos.md)). Del `.env` de la Pi se guarda una copia en un gestor de contraseñas.
- **Logs y métricas:** si `OTEL_EXPORTER_OTLP_ENDPOINT` y `OTEL_EXPORTER_OTLP_HEADERS` están en el `.env`, la API los envía a Grafana Cloud; el token de Grafana es un secreto igual que los demás.
