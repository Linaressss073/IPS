# Decision: Observabilidad por OpenTelemetry empujado a Grafana Cloud

## Date

2026-11-04

## Status

Active

## Category

Tooling Preference

## Context

Se quieren métricas, logs y trazas de la API (tablero tipo APM) sin costo. La API corre en el plan gratuito de Render, que duerme tras 15 minutos y no tiene disco persistente ni procesos acompañantes. Un esquema con `prom-client` y un `/metrics` exige que algo consulte la API, y deja huecos mientras duerme. Ya existe una cuenta de Grafana Cloud (stack `drojasl3.grafana.net`).

## Decision

La API usa `@opentelemetry/sdk-node` y **empuja** métricas, trazas y logs por OTLP a Grafana Cloud. No hay `/metrics`, `prom-client` ni proceso extra. El token se crea con permisos de escritura de métricas, logs y trazas y vive solo en variables de entorno de Render (nunca en el repositorio ni en el chat). Se desactiva con `ENV=test` o sin variables OTEL. Estado: **decidido, sin implementar** (historias IPS-154 a IPS-157 del Sprint 6).

## Alternatives Considered

- **Prometheus y Grafana propios en Render**: los servicios gratuitos duermen y no guardan datos.
- **`prom-client` con `/metrics` y un recolector**: necesita un scraper externo y deja huecos cuando la API duerme.

## Consequences

Funciona aunque la API duerma y no requiere infraestructura propia. Hay que revisar que el instrumentador de MongoDB no capture valores con datos de pacientes y respetar los límites del plan gratuito (volumen y retención).

## Adoption Impact

`adoption/tech/tech-stack.md`: agregar OpenTelemetry (SDK de Node) y Grafana Cloud como destino, marcados como planeados.
