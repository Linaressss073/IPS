# IPS · Sistema de Información Hospitalaria para la Consulta Externa

Proyecto de Práctica de Ingeniería IV (Ingeniería de Sistemas, Universidad Central): un sistema web SaaS que junta
el agendamiento, la admisión, la consulta médica y la farmacia de la consulta externa de una IPS mediana, para no
repetir información y poder seguir la traza de la atención de cada paciente.

## Monorepo

| Carpeta | Qué es |
|---|---|
| [`api/`](api/README.md) | Backend NestJS + MongoDB, organizado con DDD y CQRS. |
| [`multi-tenant-starter-template/`](multi-tenant-starter-template/README.md) | Frontend Next.js 15 (Turbopack) + Clerk (login, usuarios e IPS como organizaciones). |

Módulos: ver [contextos delimitados](api/README.md#contextos-delimitados).

## Desarrollo local

```bash
# API: http://localhost:3001/api/v1
cd api
cp deployment/secrets.example.json deployment/secrets.dev.json   # CLERK_SECRET_KEY de Clerk (Development)
pnpm install
pnpm db:up                   # MongoDB en Docker (replica set, puerto 27018)
pnpm start:dev

# Frontend: http://localhost:3000
cd multi-tenant-starter-template
cp .env.local.example .env.local
pnpm install
pnpm dev
```

Los detalles (arquitectura, tests) están en el README de cada carpeta; la referencia de **todos los endpoints**
está en [`technical-api/`](technical-api/README.md).

## Despliegue

**Producción:** una Raspberry Pi con Docker Compose, publicada por un túnel de Cloudflare: web en <https://ips.devrojas.xyz> y API en
<https://ips-api.devrojas.xyz/api/v1> (Swagger en [`/api/v1/docs`](https://ips-api.devrojas.xyz/api/v1/docs); salud en `/health`).
La única base es MongoDB Atlas (`MONGO_URL`), así que la Pi no guarda datos. Guía completa, variables y pasos en
[`deploy/pi/`](deploy/pi/README.md). El despliegue es **manual** (`deploy/pi/deploy.sh`) y se hace con el CI de `main` en verde.

**Alternativa en Render:** [`render.yaml`](render.yaml) es un *Blueprint* (en **New → Blueprint** se elige este repositorio y crea
`ips-api` y `ips-web`). El plan gratuito se agotó y suspendió la API el 17-nov-2026 (ver abajo); por eso la producción pasó a la Pi.
Detalles de la API en [`api/README.md`](api/README.md#documentación-interactiva-swagger--openapi).

### Solo si se usa Render: que la API no se duerma (plan gratuito)

Render duerme los servicios gratuitos tras 15 minutos sin tráfico (la primera petición tarda 30-60 s). Un monitor de
[UptimeRobot](https://uptimerobot.com) (plan gratuito) mantiene despierta la API:

- **URL:** `https://ips-api-3404.onrender.com/api/v1/health` (responde 200 y comprueba MongoDB; la raíz responde 404). No se registra en los logs.
- **Intervalo:** 5 minutos (el mínimo del plan gratuito), siempre por debajo de los 15 en que Render duerme el servicio.
- **Horario:** Render da ~750 horas gratuitas al mes compartidas entre todos los servicios gratuitos; la API encendida las 24 h consume casi todas
  y suspendería `ips-web`. Programar en el monitor una ventana de mantenimiento (pausa) de 19:00 a 07:00 hora de Colombia y los domingos
  (~312 h/mes). Revisar el consumo en Render → Billing.
- **Si no se configura la ventana, la cuota se agota:** el 17-nov-2026 Render suspendió la API («Free usage limit reached») hasta el
  siguiente ciclo de facturación; solo se reanuda antes cambiando el plan. Con la ventana puesta, la cuota alcanza para el mes.
- El monitor también avisa por correo si la API se cae. La solución definitiva es un plan de pago (Starter).

## Calidad y CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) corre en cada push a `main` y en cada pull request, **en cadena**: cada etapa
solo corre si la anterior pasó.

```
lint-api ─► build-api ──┐
        └─► unit-api ───┴─► e2e-api ─► sonar ─┐
web ────────────────────────────────────────────┴─► ci-ok
```

- **e2e**: MongoDB desechable con Testcontainers (requiere Docker en local; en GitHub ya viene).
- **SonarQube Cloud**: calidad y cobertura (secreto `SONAR_TOKEN`; con el análisis automático del proyecto desactivado).
  Configuración en [`sonar-project.properties`](sonar-project.properties).
- **Render** (alternativa) despliega solo cuando pasan los checks (`autoDeployTrigger: checksPass` en `render.yaml`): un commit con el CI en
  rojo no llega a producción. **La Pi no tiene ese freno**: `deploy/pi/deploy.sh` es manual, así que se ejecuta solo con el CI de `main` en verde.
- Las acciones de GitHub van fijadas por SHA de commit.

Evidencia de calidad: [`docs/`](docs/README.md) (pruebas y cobertura, validación con usuarios, seguridad y protección de datos).

Backlog y sprints: [`.epics/`](.epics/README.md) (tablero en Jira, proyecto IPS).
