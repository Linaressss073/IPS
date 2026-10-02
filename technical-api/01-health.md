# Health

[← Índice](README.md)

## Estado del servicio

```http
GET /api/v1/health
```

**Acceso:** público (sin token). Pensado para balanceadores y monitoreo; Render lo usa como *health check*.

Comprueba que la API responde y que PostgreSQL acepta consultas (`select 1`).

### Respuestas

**200 OK**: todo funciona.

```json
{ "status": "ok", "database": "up" }
```

**503 Service Unavailable**: PostgreSQL no responde. El balanceador debería sacar la instancia de servicio.

```json
{ "status": "degraded", "database": "down" }
```

> MongoDB no forma parte del health check: si Mongo falla, la API sigue funcionando (los eventos esperan en
> PostgreSQL y el historial se lee de PostgreSQL).
