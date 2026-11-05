# ADR: OpenAPI como contrato entre la API y el frontend, con tipos generados

## Status

Accepted

## Date

2026-11-04

## Context

- El frontend (Next.js) escribía a mano los tipos de lo que devuelve la API (`lib/api/*.ts`, con comentarios "Mirrors …"). Al agregar el permiso `room:view` hubo que copiarlo a mano; olvidarlo solo se notaba en ejecución.
- La API (NestJS) ya publica su especificación en `/api/v1/docs-json`, con los campos de las respuestas tomados de los tipos de retorno de los controladores.
- Los campos de valores cerrados (estado del turno, sexo, roles, permisos) salían como `string` en la especificación, así que el frontend no podía validarlos al compilar.
- Es un equipo pequeño; hay que evitar herramientas que exijan Java u otro entorno.

## Options Considered

### Option 1: Mantener los tipos a mano

- **Description**: Seguir escribiendo los tipos del frontend copiando las vistas de la API.
- **Pros**: Sin herramientas nuevas.
- **Cons**: Se desincronizan sin aviso; el error aparece en ejecución.

### Option 2: `openapi-generator-cli`

- **Description**: Generar clientes completos desde la especificación.
- **Pros**: Cliente y modelos listos.
- **Cons**: Necesita Java; genera mucho código que no se usa.

### Option 3: `openapi-typescript` sobre un `openapi.json` versionado

- **Description**: La prueba e2e de documentación escribe `api/openapi.json` (`pnpm docs:json`) y falla si está desactualizado; el frontend genera `lib/api/schema.d.ts` con `openapi-typescript` (`pnpm api:types`); el CI regenera y falla si hay diferencias.
- **Pros**: Solo tipos, sin código en ejecución; un cambio en la API rompe la compilación del frontend; sin Java.
- **Cons**: Los tipos valen tanto como la especificación; hay que regenerar al cambiar la API.

## Decision

Opción 3. `api/openapi.json` es el contrato versionado; `multi-tenant-starter-template/lib/api/schema.d.ts` se genera desde él, y los módulos de `lib/api/` derivan sus vistas de ese esquema. Las vistas de la API usan uniones del dominio en vez de `string` (ver ADL `2026-11-04-api-views-domain-enums`), de modo que la especificación trae enums reales.

## Consequences

### Benefits

- Un cambio en la API que no se refleje en el frontend falla en el CI, no en producción.
- Ya apareció valor: el compilador detectó tres tipos mal usados (sexo del formulario, vía de administración, roles en Personal).
- Las referencias nulables salen bien (`allOf` en OpenAPI 3.0).

### Trade-offs and Limitations

- `openapi.json` y `schema.d.ts` son archivos generados y grandes en el repositorio (excluidos de Sonar).
- Hay que correr `pnpm docs:json` (requiere Docker) y `pnpm api:types` tras cada cambio de contrato.
- Los tipos de entrada de formularios siguen escritos a mano cuando difieren de los DTO.

## Adoption Impact

- `adoption/tech/tech-stack.md`: agregar `openapi-typescript` (frontend) y el flujo `docs:json` / `api:types`.
- `adoption/tech/architecture.md`: registrar el contrato API–frontend y esta decisión.
