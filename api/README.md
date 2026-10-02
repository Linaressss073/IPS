# B2B API

Backend multi-tenant en **NestJS + Drizzle (PostgreSQL)** organizado con **Domain-Driven Design**.
La identidad (login, usuarios, organizaciones) la gestiona **Clerk**, igual que el frontend
(`../multi-tenant-starter-template`); esta API solo verifica sus tokens y es dueña de los datos de negocio.

Es el backend del **Sistema de Información Hospitalaria Web para la Consulta Externa** (agendamiento, admisión,
consulta médica y farmacia). Hoy incluye la base (identidad, multi-tenancy, trazabilidad, `/health`) y el
contexto **Pacientes**.

## Lenguaje ubicuo

| Término | Significado |
|---|---|
| **Team** (equipo / tenant / IPS) | La institución de salud. Dueña de todos los datos. Es una *Organization* de Clerk y se identifica con `TeamId` (su id, p. ej. `org_2abc…`). |
| **Member** (miembro) | Usuario del personal que pertenece a una IPS. Solo los miembros acceden a sus datos. |
| **Patient** (paciente) | Persona atendida por la IPS, registrada **una sola vez** para que ningún área vuelva a pedirle sus datos. Nunca se borra. |
| **Identity document** (documento) | Tipo colombiano (CC, CE, TI, RC, NIT, PA, PPT, PEP, CD, SC, CN, AS, MS) + número sin separadores. Único dentro de la IPS. |
| **Affiliation** (afiliación) | EPS + régimen (contributivo, subsidiado, especial, particular). Un paciente particular no tiene EPS; los demás sí. |
| **Companion** (acompañante) | Quien viene con el paciente (acudiente de un menor, cuidador…). Todo opcional pero con nombre o teléfono; parentesco: madre, padre, hijo, conyuge, hermano, familiar, cuidador, otro. Cada uno queda numerado (#1, #2…) en el historial del paciente; nunca se sobrescribe al anterior. |
| **Trace event** (evento de trazabilidad) | Un paso del recorrido del paciente (`patient.registered`, `patient.updated`…). Solo se agregan, nunca se modifican. |
| **requestedBy / executedBy** | Quién pidió el cambio y quién lo ejecutó; ambos son usuarios de la IPS. Si nadie más lo pidió, son el mismo. |
| **Timeline** (historial) | Todos los eventos de un paciente en orden: responde "¿qué pasó con este paciente?". |

## Contextos delimitados

| Contexto | Responsabilidad |
|---|---|
| `identity-access` | Quién llama (verifica el token de sesión de Clerk) y si es miembro del Team (organización activa del token o consulta a Clerk). Capa anticorrupción sobre Clerk. |
| `patients` | Registro único de pacientes por IPS, búsqueda y su historial (timeline). |
| `organizations` | Ficha de cada IPS en la colección **`organizations` de MongoDB**: nombre (igual al de Clerk) y datos propios (NIT con dígito de verificación DIAN, código de habilitación REPS, dirección, municipio, departamento, teléfono, correo institucional). Clerk sigue siendo dueño del acceso. |
| `staff` | Directorio mínimo del personal de cada IPS (nombre, e-mail enmascarado, rol del proveedor y rol clínico), sincronizado con Clerk por webhooks firmados y una carga masiva idempotente. Da los nombres del historial. |
| `shared` (shared kernel) | Piezas comunes: `Entity`, `ValueObject`, `DomainError`, `TeamId`, `UserId`, `Clock`, eventos de trazabilidad, conexiones a Postgres y Mongo, relay. |

## CQRS: Postgres escribe, Mongo lee el historial

```
 Frontend ──► API /api/v1
                 │
     ┌───────────┴─────────────┐
     │ POST / PATCH             │ GET
     ▼                          ▼
  COMANDOS (orquestan)        CONSULTAS (solo leen, sin dominio)
  RegisterPatient             SearchPatients     ──► Postgres
  UpdatePatient               GetPatient         ──► Postgres
     │                        GetPatientTimeline ──► Mongo | Postgres (TIMELINE_STORE)
     ▼
  DOMINIO (Patient: reglas puras)
     │
     ▼
  Postgres: ficha + evento en UNA transacción ──relay──► Mongo (patient_timeline)
```

- **Comandos** (`application/commands/`): cargan el agregado, le piden al dominio el cambio y guardan la ficha y
  su evento de trazabilidad **en la misma transacción**: si una falla, no se guarda ninguna. Cada controlador de
  comandos (`patient-commands.controller.ts`) solo traduce HTTP a un comando.
- **Consultas** (`application/queries/`): leen modelos de lectura ya listos para pintar, sin pasar por el dominio
  (`patient-queries.controller.ts`).
- **`shared_trace_events`** (Postgres) es la fuente de verdad del historial y a la vez el *outbox*:
  `TraceEventRelay` copia cada `RELAY_INTERVAL_MS` los eventos pendientes a la colección `patient_timeline`
  de Mongo y los marca como publicados en la misma transacción. Es idempotente (el id del evento es el `_id`)
  y las escrituras nunca dependen de Mongo: si está caído, los eventos esperan en Postgres.
- **`TIMELINE_STORE=mongo|postgres`** elige qué motor responde el historial; ambos devuelven lo mismo
  (lo verifica el test e2e), así se pueden comparar o desactivar Mongo sin tocar código. Mongo va hasta un
  intervalo del relay por detrás de Postgres; la ficha del paciente siempre se lee al instante.
- **Bloqueo optimista:** cada paciente tiene `version`. El `PATCH` envía la versión que leyó el cliente; si
  alguien guardó antes, responde 409 `PATIENT_VERSION_CONFLICT` en vez de pisar el cambio.

## Estructura

Basada en [este artículo](https://dev.to/bendix/applying-domain-driven-design-principles-to-a-nest-js-project-5f7b)
(una clase por acción, repositorios como interfaces inyectadas por token, modelo de dominio separado del de
persistencia, mappers), pero **agrupada primero por contexto delimitado y luego por capa**. Cada contexto sigue la
misma plantilla:

```
src/contexts/<contexto>/
├── domain/                  # Modelo de negocio puro: sin NestJS, Drizzle ni Clerk
│   ├── constants/           # Límites y patrones de negocio (longitudes, regex…)
│   ├── entities/            # Agregados/entidades (*.entity.ts) y objetos de valor (*.vo.ts)
│   ├── errors/              # Invariantes que rompe el propio agregado
│   ├── services/            # Servicios de dominio (lógica que no pertenece a una sola entidad)
│   ├── types/               # Tipos del modelo (estados, props…)
│   └── utils/
├── application/             # Orquestación: TypeScript puro
│   ├── commands/            # Lado de escritura: una clase por acción (RegisterPatient…)
│   ├── queries/             # Lado de lectura: una clase por consulta (SearchPatients…)
│   ├── constants/           # Tokens de inyección de los puertos, tipos de evento
│   ├── errors/              # Reglas que necesitan el repositorio (no encontrado, duplicado…)
│   ├── mappings/            # Entrada → objetos de valor, entidad → modelo de lectura (*View)
│   ├── ports/               # Interfaces que implementa infraestructura (*Repository, *ReadModel…)
│   ├── services/            # Servicios de aplicación reutilizados por los comandos
│   └── types/               # Comandos, queries y modelos de lectura
├── entrypoints/             # Puntos de entrada, uno por transporte
│   └── http/                # (mañana: queue/, redis/, cron/… con la misma forma)
│       ├── controllers/
│       ├── dto/             # Validación de forma (class-validator)
│       └── mapping/         # DTO → comando de aplicación
├── infrastructure/
│   ├── persistence/         # Esquema Drizzle, repositorio, modelo de lectura, mapper, repositorio en memoria (tests)
│   ├── read-models/         # Lectores de otros motores (p. ej. timeline en Mongo y en Postgres)
│   └── providers/           # Adaptadores externos (Clerk) y cableado NestJS de puertos, comandos y consultas
└── <contexto>.module.ts     # Solo importa módulos, controladores y providers
```

Carpetas extra fuera de la plantilla, porque sus piezas no encajan en otras:
`identity-access/entrypoints/http/{guards,decorators}` (`@TeamScoped`, `@TeamAdmin`, `@CurrentTeam`, `@CurrentUser`),
`src/integrations/clerk` (webhooks de Clerk repartidos a los contextos que guardan copia de sus datos) y
`shared/entrypoints/http/filters` (`DomainErrorFilter`: errores de dominio → HTTP).

`shared/` es el *shared kernel* y usa las mismas capas, solo con lo que tiene: `domain/{entities,errors,utils}`
(`Entity`, `ValueObject`, `TeamId`, `UserId`, `DomainError`), `application/{constants,ports,types}` (`Clock`,
`TraceEvent`, `Actor`), `infrastructure/{persistence,providers}` (Drizzle, Mongo, tabla `shared_trace_events`,
`TraceEventRelay`, `systemClock`) y `entrypoints/http/{controllers,filters}` (`/health`).

**Comunicación entre contextos:** un contexto nunca importa el dominio de otro. Declara un puerto en su
`application/ports` y lo implementa con un adaptador en `infrastructure/providers/<otro-contexto>/` que usa la
consulta pública exportada por el módulo del otro contexto.

**Reglas de dependencia:** `entrypoints → application → domain` e `infrastructure → application / domain`.
El dominio no importa nada de fuera; la aplicación solo conoce puertos, nunca implementaciones.

**Multi-tenancy:** todas las rutas de negocio cuelgan de `/teams/:teamId/...`, protegidas con `@TeamScoped()`
(token válido + miembro del team), y todos los métodos del repositorio reciben el `TeamId`.

## Endpoints

Todas las rutas cuelgan del prefijo **`/api/v1`** (`API_PREFIX` en `src/config/http.ts`), p. ej.
`GET /api/v1/health`; la tabla las muestra sin él. Todas salvo `/health` requieren
`Authorization: Bearer <token de sesión de Clerk>`.

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/health` | Estado de la API y la BD (sin auth; 503 si la BD no responde) |
| POST | `/teams/:teamId/patients` | **Comando** RegisterPatient |
| PATCH | `/teams/:teamId/patients/:patientId` | **Comando** UpdatePatient (`version` obligatorio) |
| GET | `/teams/:teamId/patients?q=&page=&pageSize=` | **Consulta** SearchPatients (documento o nombres, sin tildes ni mayúsculas; máx. 100 por página) |
| GET | `/teams/:teamId/patients/:patientId` | **Consulta** GetPatient |
| GET | `/teams/:teamId/patients/:patientId/timeline` | **Consulta** GetPatientTimeline (más antiguo primero) |
| POST | `/teams/:teamId/patients/:patientId/companions` | **Comando** RecordCompanion (siguiente número) |
| GET | `/teams/:teamId/staff` | **Consulta** ListTeamStaff (personal de la IPS, e-mail enmascarado) |
| GET | `/organizations/:teamId` | **Consulta** GetOrganization (miembros; la importa de Clerk si aún no está en Mongo) |
| PATCH | `/organizations/:teamId` | **Comando** UpdateOrganization (solo administradores; `version` obligatorio; el nombre también se cambia en Clerk) |
| DELETE | `/organizations/:teamId` | **Comando** DeleteOrganization (solo administradores; 204; elimina la organización en Clerk y deja una lápida; **no** borra pacientes ni historial) |
| POST | `/webhooks/clerk` | Webhook de Clerk (sin sesión; se verifica la firma sobre el cuerpo crudo). Lo reparte a `staff` y `organizations` |
| GET | `/teams/:teamId/patients/:patientId/companions` | **Consulta** GetPatientCompanions (`{ history }`, número más alto primero) |

Cuerpo de `POST /patients` (en `PATCH`, cada grupo enviado reemplaza al actual completo, más `version`):

```json
{
  "document": { "type": "CC", "number": "1.000.123.456" },
  "name": { "firstName": "Andrés", "middleName": "Alejandro", "firstLastName": "Gómez", "secondLastName": "Torres" },
  "birthDate": "1990-05-20",
  "sex": "H",
  "contact": { "email": "andres@example.com", "phone": "300 123 4567", "address": null },
  "affiliation": { "eps": "Sanitas", "regime": "contributivo" },
  "companion": { "relationship": "madre", "name": { "firstName": "María", "firstLastName": "Torres" }, "document": { "type": "CC", "number": "52000111" }, "phone": "3001112222", "email": null },
  "requestedBy": "<userId opcional; por defecto, quien llama>"
}
```

`companion` es opcional y queda como acompañante #1. Los siguientes se agregan con `POST .../companions`: cada uno es un
evento `patient.companion_recorded` (en la misma colección del historial, sin tablas ni colecciones nuevas) con su
`number`, asignado en Postgres bloqueando la fila del paciente para que dos registros simultáneos nunca repitan número.

Errores de dominio: validación → 400, no miembro → 403, no encontrado → 404, conflictos de reglas de negocio → 409,
siempre con un `code` legible por máquina (`INVALID_VALUE`, `INVALID_BIRTH_DATE`, `INVALID_REQUESTER`,
`PATIENT_NOT_FOUND`, `DOCUMENT_ALREADY_REGISTERED`, `PATIENT_VERSION_CONFLICT`…).

## Datos del personal: minimización y ofuscación

El contexto `staff` guarda una copia **mínima** de los usuarios de Clerk (Ley 1581 de 2012, Habeas Data):

- **Solo** id de Clerk, nombre para mostrar y e-mail **enmascarado** (`andres.gomez@clinica.com.co` → `and****@cli***.c**`):
  se ocultan usuario, dominio y terminación, con máscaras de largo fijo. El e-mail completo, teléfonos, fotos y
  contraseñas nunca llegan a la base. El frontend aplica la misma regla a lo que muestra.
- **Derecho al olvido:** `user.deleted` anonimiza (nombre y e-mail a `null`, se borran sus membresías) y deja solo el
  id seudónimo para que la auditoría siga enlazada; el historial muestra "Usuario eliminado". Una actualización
  vieja que llegue tarde no revive los datos.
- **Los nombres no se copian a los eventos de trazabilidad:** se resuelven al leer, así anonimizar a alguien lo
  oculta en todo el historial (Postgres y Mongo) a la vez.
- **Los webhooks no se registran en el log** (solo tipo de evento) y se rechazan si la firma no es válida.
- Solo los miembros de una IPS ven el personal de esa IPS.
- **Copia en MongoDB (colección `staff`)** para consultarla desde Atlas: un documento por usuario
  (`_id` = id de Clerk) con `displayName`, `emailMasked`, `deleted` y `teams[]` (IPS, rol de Clerk y rol clínico).
  Postgres es la fuente de verdad: cada cambio **reconstruye** el documento del usuario desde Postgres, así la copia
  nunca queda desfasada aunque los webhooks lleguen fuera de orden; si Mongo falla, el webhook responde error y Clerk
  lo reintenta. Mismos datos minimizados que Postgres (nunca el e-mail completo); un usuario anonimizado queda con
  `deleted: true`, sin nombre, sin e-mail y sin IPS.

Configuración: en Clerk → **Webhooks**, crear un endpoint `https://<api>/api/v1/webhooks/clerk` con los eventos
`user.created`, `user.updated`, `user.deleted`, `organization.created`, `organization.updated`,
`organization.deleted` y `organizationMembership.*`, y poner su
*signing secret* en `CLERK_WEBHOOK_SIGNING_SECRET`. Para cargar a los usuarios que ya existían:
`pnpm build && pnpm clerk:sync` (idempotente; carga organizaciones, usuarios y membresías y reconstruye la
colección `staff` de MongoDB).

## Configuración por entorno

La API no usa archivos `.env`. Cada entorno (`ENV` = `dev` por defecto, `test` o `prod`) toma sus valores de:

1. `deployment/config.json`: valores **no secretos** por entorno (se sube al repo).
2. `deployment/secrets.<env>.json`: llaves y contraseñas (**ignorado por git**; plantilla en
   `deployment/secrets.example.json`).
3. Variables de entorno reales, que tienen la última palabra (así Render las define en su panel).

```bash
pnpm start:dev                      # ENV=dev por defecto
ENV=prod pnpm clerk:sync            # bash; en PowerShell: $env:ENV="prod"; pnpm clerk:sync
```

`ENV=test` lo usan los e2e (sus bases `b2b_test` / `his_test` vienen de `vitest.config.e2e.ts`) y Render corre con
`ENV=prod`. Variables: `PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `MONGO_URL`, `TIMELINE_STORE`, `RELAY_INTERVAL_MS`,
`CLERK_SECRET_KEY`, `CLERK_JWT_KEY`, `CLERK_AUTHORIZED_PARTIES`, `CLERK_WEBHOOK_SIGNING_SECRET` (ver `src/config/env.ts`).

## Desarrollo local

```bash
cp deployment/secrets.example.json deployment/secrets.dev.json   # poner CLERK_SECRET_KEY (misma app de Clerk que el frontend)
pnpm install
pnpm db:up                # Postgres 17 en Docker (puerto 5433)
                          # + un MongoDB propio en MONGO_URL (p. ej. localhost:27017), o MONGO_URL vacío
                          #   para trabajar solo con Postgres
pnpm db:migrate           # aplica las migraciones de ./drizzle
pnpm start:dev            # http://localhost:3001/api/v1
```

Cambiar el esquema: editar el `*.schema.ts` del contexto → `pnpm db:generate --name <cambio>` → `pnpm db:migrate`.

## Tests

```bash
pnpm test        # unitarios: dominio y casos de uso (repositorio en memoria)
pnpm test:e2e    # HTTP + Postgres y Mongo reales; Clerk sustituido por dobles (requiere db:up y Mongo)
                 # Usa bases propias que se vacían en cada test: Postgres b2b_test (se crea y migra sola)
                 # y Mongo his_test. Se cambian con DATABASE_URL_TEST / MONGO_URL_TEST, y se niega a
                 # correr si el nombre no termina en "_test", para no tocar nunca los datos de desarrollo.
```

## Añadir un nuevo contexto

1. Crear `src/contexts/<contexto>/` con la plantilla de carpetas de arriba.
2. Modelar en `domain/` con el lenguaje ubicuo: agregado en `entities/`, objetos de valor `*.vo.ts`, invariantes en `errors/`.
3. Puerto del repositorio en `application/ports/` + su token en `application/constants/`; un comando por clase en `application/commands/` y una consulta por clase en `application/queries/`. Los comandos que cambian algo del recorrido del paciente guardan un `TraceEvent` en la misma transacción (`appendTraceEvents`).
4. Tabla Drizzle en `infrastructure/persistence/*.schema.ts` (se detecta sola en `drizzle.config.ts`) + repositorio + mapper.
5. Cableado en `infrastructure/providers/<contexto>.providers.ts`.
6. Controller en `entrypoints/http/controllers/` bajo `teams/:teamId/...` con `@TeamScoped()`, DTOs en `http/dto/` y conversión en `http/mapping/`.
7. `<contexto>.module.ts` que importe `IdentityAccessModule`, y registrarlo en `AppModule`.
8. Si necesita datos de otro contexto, referenciarlos solo por ID y leerlos a través de un puerto, nunca importar su agregado.
