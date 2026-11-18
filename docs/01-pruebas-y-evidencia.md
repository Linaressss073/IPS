# Pruebas y evidencia de calidad

[← Índice](README.md)

Qué se probó, cómo y con qué resultado. Las cifras salen de la ejecución real (17-nov-2026); lo que no se pudo medir se dice como tal.

## 1. Resumen

| Capa | Herramienta | Resultado |
|---|---|---|
| Unitarias (dominio y casos de uso de la API) | Vitest | **97** pruebas, 18 archivos, todas pasan |
| Integración / extremo a extremo de la API (HTTP + MongoDB real) | Vitest + Supertest + Testcontainers (`mongo:8.0.4`, conjunto de réplicas) | **65** pruebas, 12 archivos, todas pasan |
| Frontend (PDF de la fórmula, cantidad en letras, cabeceras de seguridad) | Vitest | **34** pruebas, 3 archivos, todas pasan |
| Análisis estático y calidad | oxlint, ESLint, `tsc`, SonarCloud | Gate **OK**: 0 bugs, 0 vulnerabilidades, 0 hotspots, 0 *code smells*, 0 % duplicación |
| Cobertura (unitarias + e2e combinadas) | SonarCloud | **87,8 %** (umbral del proyecto: 80 %) sobre ~20 000 líneas de código |
| Accesibilidad y UX | Revisión QA (guías ui-ux-pro-max, escáner estático, Lighthouse, contraste calculado) | 4 historias corregidas; 6 en el backlog (sección 5) |

Los e2e **no usan simulacros de base de datos**: cada ejecución levanta un MongoDB real en un contenedor, con transacciones, y solo reemplaza a Clerk por dobles (usuarios y membresías de prueba).

## 2. Pirámide y qué cubre cada nivel

- **Unitarias:** reglas de negocio puras (la matriz de permisos por rol, entidades de paciente, turno, consulta, producto y entrega de farmacia, agendas y citas, anonimización del personal, configuración del despliegue y de los logs) sin red ni base de datos.
- **E2E de la API:** cada contexto recorre sus endpoints completos, incluido el rechazo por permisos y el aislamiento entre IPS.
- **Frontend:** lógica de presentación (PDF de la fórmula, cantidades en letras en español, cabeceras de seguridad de `next.config`).

### E2E por contexto

| Archivo | Pruebas | Qué demuestra |
|---|---|---|
| `patients.e2e-spec.ts` | 17 | Alta, edición con control de versión, documento único por IPS, historial de trazabilidad, autorización del titular, **aislamiento entre IPS** |
| `scheduling.e2e-spec.ts` | 6 | Agendas, cupos, citas, cruces de horario, reprogramación |
| `staff.e2e-spec.ts` | 6 | Roles, permisos efectivos, anonimización de personal |
| `admission.e2e-spec.ts` | 5 | Llegada, turnos, llamado y reanuncio |
| `pharmacy.e2e-spec.ts` | 5 | Fórmulas, entregas parciales, existencias, lotes vencidos |
| `organizations.e2e-spec.ts` | 4 | Alta, renombre y baja de IPS sincronizadas con Clerk |
| `errors.e2e-spec.ts` | 4 | Formato único de error (401, 404, JSON roto, validación) |
| `consultation.e2e-spec.ts` | 5 | Consulta, firma, notas aclaratorias, registro de accesos a la historia |
| `docs.e2e-spec.ts` | 7 | Documento OpenAPI con todos los campos y esquemas de autenticación |
| `health.e2e-spec.ts` | 3 | Salud con base arriba y caída (503) |
| `security.e2e-spec.ts` | 2 | Cabeceras de seguridad y límite de peticiones (429) por cliente |
| `clerk-reconciliation.e2e-spec.ts` | 1 | Reconciliación con Clerk ante webhooks perdidos |

## 3. Integración continua (nada se despliega si algo falla)

Cada *push* a `main` ejecuta en GitHub Actions una cadena de trabajos con dependencias (`needs`): `lint-api` → `build-api` y `unit-api` (en paralelo) → `e2e-api` (Testcontainers) → `sonar` (análisis y *quality gate* de SonarCloud); `web` (tipos de la API sin desfase, pruebas y compilación del frontend) corre aparte, y la compuerta final `ci-ok` exige todos. **Render solo despliega cuando esa compuerta pasa** (`autoDeployTrigger: checksPass`). Las acciones de terceros están fijadas por SHA de commit para evitar sustituciones.

## 4. Pruebas de seguridad automatizadas

- El 401 sin token y el 404 de ruta inexistente salen en el formato común (`statusCode`, `code`, `message`).
- Las respuestas llevan `X-Content-Type-Options`, `Referrer-Policy` y `Strict-Transport-Security` y no exponen `x-powered-by`.
- Superar el límite de peticiones por minuto responde 429, con contador por cliente y sin limitar `/health`.
- Una petición con el token de otra IPS se rechaza y los pacientes e historiales de otra IPS no se ven (`patients.e2e-spec.ts`: «rejects requests … from another team», «hides patients and timelines of other teams»).
- Solo los administradores asignan roles, y los roles habilitan los endpoints que les corresponden (`staff.e2e-spec.ts`).
- La matriz de permisos se verifica en una prueba unitaria: la historia clínica solo es de los médicos (`clinical:read`/`clinical:write`); ni los administradores la leen.

- En producción se ejecuta `deploy/pi/smoke-test.sh` tras cada despliegue: 27 comprobaciones de solo lectura (cabeceras, 401 sin sesión, formato de errores, CORS, webhook sin firma, TLS). El 18-nov-2026: 26 superadas y 1 hallazgo (HTTP sin redirección a HTTPS), corregido el mismo día: 27 de 27. Detalle en [03 · Protección de datos](03-proteccion-de-datos.md#5-pruebas-de-seguridad-en-producción-18-nov-2026).

Detalle de los controles: [Protección de datos](03-proteccion-de-datos.md).

## 5. Revisión QA de accesibilidad y UX (4-nov-2026)

Método: guías de accesibilidad de ui-ux-pro-max, escáner estático de los 72 archivos `.tsx` de `app/` y `components/`, Lighthouse sobre la landing y el inicio de sesión desplegados, cálculo de contraste WCAG sobre la paleta y pruebas en vivo de la API.

**Corregido** (commit `b67708a`, historias IPS-143 a IPS-146):

| Hallazgo | Antes | Después |
|---|---|---|
| Mensajes de error sin anuncio a lectores de pantalla | 42 sin `role="alert"` | 34 con `role="alert"` |
| Campos sin nombre accesible | 25 candidatos | 21 con `aria-label` (el resto reciben la etiqueta de su envoltorio) |
| Contraste del borde de campos | 1,33:1 (claro), 1,36:1 (oscuro) | 3,88:1 y 3,87:1 (mínimo WCAG 1.4.11: 3:1) |
| Rojo de error en modo oscuro | 4,0:1 | 5,28:1 (mínimo 4,5:1) |
| Tablas sin título ni `scope` | 3 | 3 corregidas |
| Sin enlace "Saltar al contenido" | no existía | agregado |
| Sin respeto a "reducir movimiento" | 0 usos, 7 animaciones | regla global |
| Texto de 10-11 px | 6 casos | 12 px |

**Corregido después:** etiquetas visibles en vez de solo *placeholder* en los formularios de inventario, farmacia, CIE-10 y cancelación de citas, y sin autocompletado de datos de terceros (IPS-147); aviso grande de sonido apagado, de falta de voz en español y de más de un minuto sin conexión en la pantalla de sala (IPS-148).

**Pendiente:** instancia de producción de Clerk (IPS-151) y pruebas automáticas de accesibilidad y del flujo completo en la organización DEV (IPS-152): requieren credenciales de pruebas de Clerk y un entorno de navegador que no están en el repositorio.

Limitación declarada: la verificación con navegador y sesión iniciada (axe sobre las pantallas del tablero) no se pudo ejecutar en esa revisión; los contrastes son calculados sobre la paleta, no medidos en pantalla.

## 6. Observabilidad como evidencia

Los logs de la API se envían a Grafana Cloud (Loki) con el identificador de cada petición y la IPS (`teamId`); no incluyen cuerpos, cabeceras ni valores de consulta (una búsqueda puede ser el nombre o documento de un paciente). Hay un tablero público de rendimiento sin variables ni líneas de log. Un monitor de UptimeRobot consulta `/api/v1/health` cada 5 minutos.

Al verificar el tablero con tráfico real se halló y corrigió un defecto: la latencia usaba rangos de histograma pensados para milisegundos con valores en segundos (todas las peticiones caían en el rango de 0 a 5 s). Ahora los rangos van de 5 ms a 10 s y una prueba lo comprueba.

## 7. Evidencias para anexar al informe

Capturas que respaldan este documento (las toma quien sustenta; no se generan desde el repositorio):

1. GitHub Actions con la cadena de trabajos en verde.
2. SonarCloud: gate aprobado, cobertura y 0 incidencias.
3. Organización de prueba **DEV** en Clerk, con miembros y roles.
4. Grafana: logs filtrados por `teamId` y tablero de rendimiento.
5. Cabeceras de respuesta en las herramientas de desarrollo del navegador (`/api/v1/health`).
6. Swagger (`/api/v1/docs`) con los dos esquemas de autenticación.
7. Resultados de la validación con usuarios: ver [Validación con usuarios](02-validacion-con-usuarios.md).

## 8. Brechas conocidas

- No hay pruebas automáticas de la interfaz de extremo a extremo (IPS-152).
- No se ha medido carga ni rendimiento bajo concurrencia; la producción es una sola Raspberry Pi (sin réplicas ni conmutación por fallo) y el plan gratuito de Render, que se usó antes, se agotó el 17-nov-2026.
- La validación con usuarios reales está **diseñada pero no ejecutada** hasta que se registren resultados en el documento 02.
