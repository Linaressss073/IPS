# Observabilidad

La API empuja sus métricas por OpenTelemetry a Grafana Cloud (ver [README de la API](../api/README.md#métricas-opentelemetry--grafana-cloud) y el [ADL](../.pair/adoption/decision-log/2026-11-04-observability-otlp-push-grafana-cloud.md)).

## Dashboard público `IPS · Rendimiento de la API`

`grafana/ips-apm-public.dashboard.json`. Un dashboard **público** de Grafana (Share → Share externally) no puede usar variables, por eso este archivo no las tiene: el servicio queda fijo en `ips-api` y las fuentes de datos se eligen **al importar** (Grafana pide dos: "Fuente de métricas (Prometheus)" y "Fuente de logs (Loki), solo para contar"). Incluye el **conteo de logs por nivel**, pero no las líneas de log. Pasos:

1. Dashboards → New → **Import** → subir el archivo → elegir la fuente de métricas (la que termina en `-prom`) y la de logs (`-logs`).
2. Abrir el dashboard → **Share** → **Share externally** → copiar el enlace.
3. Para dejar de publicarlo: Dashboards → **Shared dashboards** → pausar o eliminar el enlace.

Qué ve cualquiera con el enlace: peticiones por minuto, latencia y errores por **ruta** (como plantilla, `/api/v1/teams/:teamId/patients`, nunca la URL real) y cuántos logs hay de cada nivel. No ve datos de pacientes ni el contenido de ningún log (las líneas llevan ids de organización y rutas, por eso solo están en el dashboard privado). Cada visita consulta la cuota gratuita de Grafana Cloud: se refresca cada minuto, y si llegara mucho tráfico conviene pausar el enlace.

El archivo privado (`ips-apm.dashboard.json`, con variables y logs) **no** debe publicarse. Ambos salen del mismo generador, así que cambian juntos.

## Dashboard privado `IPS · APM y logs`

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
- **Logs:** listado y volumen por nivel. Se llenan cuando la API desplegada envía sus logs por OTLP (IPS-155). El volumen por nivel agrupa por `detected_level`, que Loki asigna solo; si en tu Grafana el nivel llega con otro nombre (por ejemplo `severity_text`), cámbialo en la consulta del panel.

Limitaciones conocidas:

- No hay `uptime` real: la API **empuja** sus métricas y la instancia gratuita duerme sin tráfico; se usa "Última métrica recibida hace". Sin datos significa dormida o sin peticiones.
- Las métricas son las de OpenTelemetry (`http_server_request_duration_seconds_*`), no `http_requests_total`.
- "Live" de los logs solo existe en Explore: abre el panel de logs en Explore y pulsa **Live**. En el dashboard se actualiza cada 30 s.
