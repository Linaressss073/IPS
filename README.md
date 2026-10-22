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

## Despliegue (Render)

[`render.yaml`](render.yaml) es un *Blueprint* de Render: en **New → Blueprint** se elige este repositorio y crea
`ips-api` y `ips-web` en el proyecto *Practica / Production*. La única base es MongoDB Atlas (`MONGO_URL`). Solo
pide los secretos (las llaves de Clerk y `MONGO_URL`); la API crea sus índices al arrancar.

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
- **Render** despliega solo cuando pasan los checks (`autoDeployTrigger: checksPass` en `render.yaml`): un commit con el CI en
  rojo no llega a producción.
- Las acciones de GitHub van fijadas por SHA de commit.

Backlog y sprints: [`.epics/`](.epics/README.md) (tablero en Jira, proyecto IPS).
