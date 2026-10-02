# IPS · Sistema de Información Hospitalaria para la Consulta Externa

Proyecto de Práctica de Ingeniería IV (Ingeniería de Sistemas, Universidad Central): un sistema web SaaS que junta
el agendamiento, la admisión, la consulta médica y la farmacia de la consulta externa de una IPS mediana, para no
repetir información y poder seguir la traza de la atención de cada paciente.

## Monorepo

| Carpeta | Qué es |
|---|---|
| [`api/`](api/README.md) | Backend NestJS + MongoDB, organizado con DDD y CQRS. |
| [`multi-tenant-starter-template/`](multi-tenant-starter-template/README.md) | Frontend Next.js 15 (Turbopack) + Clerk (login, usuarios e IPS como organizaciones). |

Módulos actuales: **Pacientes** (registro único por IPS, búsqueda, acompañantes numerados e historial con
`requestedBy` / `executedBy`) **Personal** (directorio mínimo y ofuscado del personal de cada IPS, sincronizado
con Clerk) y **Organizaciones** (ficha de cada IPS en MongoDB: NIT, código REPS, contacto). Siguientes: agendamiento, admisión y turnos, consulta médica y farmacia.

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
