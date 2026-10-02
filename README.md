# IPS · Sistema de Información Hospitalaria para la Consulta Externa

Proyecto de Práctica de Ingeniería IV (Ingeniería de Sistemas, Universidad Central): un sistema web SaaS que junta
el agendamiento, la admisión, la consulta médica y la farmacia de la consulta externa de una IPS mediana, para no
repetir información y poder seguir la traza de la atención de cada paciente.

## Monorepo

| Carpeta | Qué es |
|---|---|
| [`api/`](api/README.md) | Backend NestJS + PostgreSQL (fuente de verdad) + MongoDB (historial), organizado con DDD y CQRS. |
| [`multi-tenant-starter-template/`](multi-tenant-starter-template/README.md) | Frontend Next.js 15 (Turbopack) + Hexclave (login, usuarios e IPS como equipos). |

Módulos actuales: **Pacientes** (registro único por IPS, búsqueda, acompañantes numerados e historial con
`requestedBy` / `executedBy`). Siguientes: agendamiento, admisión y turnos, consulta médica y farmacia.

## Desarrollo local

```bash
# API: http://localhost:3001/api/v1
cd api
cp .env.example .env          # completar HEXCLAVE_* con el mismo proyecto del frontend
pnpm install
pnpm db:up && pnpm db:migrate # Postgres en Docker; Mongo propio en MONGO_URL (opcional)
pnpm start:dev

# Frontend: http://localhost:3000
cd multi-tenant-starter-template
cp .env.local.example .env.local
pnpm install
pnpm dev
```

Los detalles (arquitectura, endpoints, tests) están en el README de cada carpeta.
