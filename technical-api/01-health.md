# Health

[← Índice](README.md)

## Estado del servicio

```http
GET /api/v1/health
```

**Acceso:** público (sin token). Pensado para balanceadores y monitoreo; Render lo usa como *health check*.

Comprueba que la API responde y que MongoDB acepta comandos (`ping`).

### Respuestas

**200 OK**: todo funciona.

```json
{ "status": "ok", "database": "up" }
```

**503 Service Unavailable**: MongoDB no responde. El balanceador debería sacar la instancia de servicio.

```json
{ "status": "degraded", "database": "down" }
```
