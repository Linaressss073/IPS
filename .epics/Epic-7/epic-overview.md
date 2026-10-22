# Épica 7: Calidad continua y operación

## Objetivo

Que ningún cambio que rompa las pruebas llegue a producción y que el personal no confunda un servidor que está
despertando con una falla. Hoy la API y el frontend compilan, pasan lint y 77 pruebas unitarias, y hay 9 archivos de
pruebas e2e, pero todo se corre a mano: Render despliega `main` aunque una prueba falle. El contexto de identidad y
acceso, que protege el aislamiento entre IPS, no tiene pruebas unitarias propias. Y en el plan gratuito de Render la
API se duerme tras ~15 minutos sin uso: la primera petición tarda 30 a 60 s.

**Estado:** propuesta, pendiente de aprobación. Nace del análisis del repositorio del 21 de octubre de 2026.

## Documentos de referencia

- `api/README.md` (sección Tests), `technical-api/README.md` (nota sobre Render), `render.yaml`.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Plataforma de verificación | **Render**, no GitHub Actions (decisión del usuario, 21-oct-2026): la verificación corre en el *build* de cada servicio y, si falla, Render no despliega y deja la versión anterior. |
| Qué verifica Render | API: lint, pruebas unitarias y compilación. Frontend: `next build` (compila y revisa tipos). |
| Pruebas e2e | Siguen siendo locales antes de subir (`pnpm db:up && pnpm test:e2e`): necesitan MongoDB en *replica set*, que el *build* de Render no tiene. |
| Base de datos de pruebas | La misma regla actual: el nombre debe terminar en `_test`. |
| `render.yaml` | Solo se cambian los comandos de *build*; quitar un servicio de ese archivo lo elimina en Render. |

## Orden de las historias

### Historia 1: Render solo despliega lo que pasa la verificación

**Prioridad**: protege todo lo construido en las épicas 1 a 6.
El *build* de la API en Render corre lint y pruebas unitarias antes de compilar; si algo falla, el despliegue se
detiene y producción sigue con la versión anterior. Los e2e quedan documentados como paso local antes de subir.
**Dependencias**: ninguna.

### Historia 2: Pruebas del aislamiento entre IPS y de los permisos

**Prioridad**: es el control de seguridad más importante y no tiene pruebas propias.
Pruebas automáticas que demuestran que nadie accede a otra IPS ni a una acción sin permiso, incluida la matriz de
permisos por rol.
**Dependencias**: Historia 1 (para que corran en cada despliegue).

### Historia 3: Aviso cuando el servidor está despertando

**Prioridad**: evita reportes falsos de "el sistema no sirve".
Cuando la API tarda por estar dormida, la aplicación muestra un aviso claro y reintenta sola.
**Dependencias**: ninguna.

## Contexto compartido para el detalle de historias

- **Pruebas:** `api/vitest.config.ts`, `api/vitest.config.e2e.ts`, `api/test/support/` (`global-setup.ts`,
  `test-env.ts`, `clerk-webhook.ts`), `api/docker-compose.yml`, scripts de `api/package.json`.
- **Identidad y acceso:** `api/src/contexts/identity-access/`, guardas y decoradores en
  `identity-access/entrypoints/http/{guards,decorators}`.
- **Frontend:** `multi-tenant-starter-template/lib/api/` (cliente HTTP y `use-api-auth.ts`), `app/loading.tsx`.
- **Despliegue:** `render.yaml` (`buildCommand` de `ips-api` e `ips-web`).

## Preguntas abiertas

1. ¿Interesa pagar un plan de Render sin suspensión en lugar de la Historia 3?
2. ¿Más adelante se quieren los e2e en cada cambio? Exigiría otra plataforma (o MongoDB en memoria en el *build*).
