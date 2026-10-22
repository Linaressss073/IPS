# Historia 1: Render solo despliega lo que pasa el CI de GitHub

> Como integrante del equipo de desarrollo, quiero que Render solo despliegue un cambio cuando pasen los checks de GitHub para que ningún error conocido llegue a producción.

## Estado

En curso (Jira IPS-36). CI en cadena en verde con Sonar; falta confirmar el despliegue de Render tras un CI verde.

## Decisión (22-oct-2026)

La verificación corre en GitHub Actions (`.github/workflows/ci.yml`) y Render espera sus checks con `autoDeployTrigger: checksPass` en `ips-api` e `ips-web`. Reemplaza la idea inicial de verificar en el build de Render, donde no hay MongoDB para los e2e.

```
lint-api ─► build-api ──┐
        └─► unit-api ───┴─► e2e-api ─► sonar ─┐
web ────────────────────────────────────────────┴─► ci-ok
```

## Criterios de aceptación

- [x] **Dado que** subo a `main` un cambio que rompe una prueba unitaria o e2e, **cuando** termina el CI, **entonces** aparece en rojo y Render no despliega (verificado: los commits con CI en rojo no desplegaron).
- [x] **Dado que** el lint falla, **cuando** corre el CI, **entonces** no corren build, unitarias, e2e ni Sonar (verificado en la ejecución del 22-oct).
- [ ] **Dado que** todo pasa, **cuando** termina el CI, **entonces** Render despliega como antes.
- [x] **Dado que** el CI corre los e2e, **cuando** termina, **entonces** usó un MongoDB desechable (Testcontainers) y nunca una base de desarrollo ni de producción.
- [x] **Dado que** `SONAR_TOKEN` existe, **cuando** corre el CI, **entonces** Sonar publica cobertura y calidad.

## Hecho

- CI en cadena (`3c2937d`, `5b13fc8`, `e5ccf4b`, `a94deae`); e2e con Testcontainers y reintentos; acciones fijadas por SHA.
- `checksPass` en `render.yaml`.
- Pino para logs (`LOG_LEVEL`).

## Pendiente

- Confirmar en Render el despliegue de `a94deae` (primer commit con CI completo en verde) y cerrar la historia.
