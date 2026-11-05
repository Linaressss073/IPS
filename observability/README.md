# Observabilidad

La API empuja sus métricas por OpenTelemetry a Grafana Cloud (ver [README de la API](../api/README.md#métricas-opentelemetry--grafana-cloud) y el [ADL](../.pair/adoption/decision-log/2026-11-04-observability-otlp-push-grafana-cloud.md)).

## Dashboard `IPS · APM y logs`

`grafana/ips-apm.dashboard.json`. Importarlo: Grafana → Dashboards → New → **Import** → subir el archivo → elegir las fuentes de datos (la de métricas termina en `-prom` y la de logs en `-logs`).

| Variable | Qué filtra |
|---|---|
| `Fuente de métricas`, `Fuente de logs` | Las fuentes de datos de Prometheus y de Loki |
| `Entorno` | `deployment_environment` (`prod`, `dev`…). Aparece tras desplegar el cambio que lo envía |
| `Servicio` | `service_name` (`ips-api`) |
| `Buscar en logs` | Texto que debe contener cada línea de log |

Paneles:

- **Estado general:** si llegan métricas, tasa de éxito (sin 5xx), peticiones por segundo y segundos desde la última métrica.
- **Rendimiento:** peticiones por minuto por método y ruta, latencia p50/p95/p99 y tabla de errores 4xx/5xx.
- **Logs:** listado y volumen por nivel. **Vacíos hasta IPS-155** (logs por OTLP).

Limitaciones conocidas:

- No hay `uptime` real: la API **empuja** sus métricas y la instancia gratuita duerme sin tráfico; se usa "Última métrica recibida hace". Sin datos significa dormida o sin peticiones.
- Las métricas son las de OpenTelemetry (`http_server_request_duration_seconds_*`), no `http_requests_total`.
- "Live" de los logs solo existe en Explore: abre el panel de logs en Explore y pulsa **Live**. En el dashboard se actualiza cada 30 s.
