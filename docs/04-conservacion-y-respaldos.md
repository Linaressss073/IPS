# Política de conservación, supresión y respaldos

[← Índice](README.md)

Cuánto tiempo se guardan los datos, quién responde por ellos, qué pasa cuando alguien pide borrarlos y cómo se recupera el sistema ante un fallo. Es una política de proyecto: la adopta cada IPS que use el sistema, y la redacción legal debe revisarla un asesor jurídico (ver la nota de [03 · Protección de datos](03-proteccion-de-datos.md)).

## 1. Roles

| Rol | Quién | Responsabilidad |
|---|---|---|
| **Responsable del tratamiento** | Cada IPS (organización en Clerk) | Decide para qué y por cuánto tiempo se usan los datos; recoge la autorización del paciente; atiende sus solicitudes |
| **Encargado del tratamiento** | Quien opera el sistema | Trata los datos solo según las instrucciones de la IPS; aplica los controles de seguridad del documento 03 |
| **Subencargados (proveedores)** | Raspberry Pi propia con Cloudflare (API y web; no guarda datos), MongoDB Atlas (base de datos), Clerk (identidad), Spacemail (correo), Grafana Cloud (logs sin datos de salud) | Alojan o procesan datos por cuenta del encargado; se verifican sus condiciones antes de usar datos reales |

## 2. Conservación

La historia clínica se conserva **20 años desde la última atención**: 5 años en el archivo de gestión y 15 en el archivo central (Resolución 1995 de 1999, complementada por la Resolución 839 de 2017). La solicitud de supresión **no procede** mientras exista un deber legal de conservar el dato (Decreto 1074 de 2015, que compila el Decreto 1377 de 2013).

| Dato | Dónde | Conservación | Supresión desde la aplicación |
|---|---|---|---|
| Identidad y datos del paciente | `patients` | Mientras exista su historia clínica (20 años desde la última atención) | No: los pacientes **no se borran** para no romper su trazabilidad |
| Consultas, diagnósticos y fórmulas | `consultations` | 20 años desde la última atención | No: una consulta firmada es inmutable; solo admite notas aclaratorias |
| Historial de eventos (auditoría) | `trace_events` (solo se agrega) | Igual que la historia clínica | No |
| Registro de accesos a la historia | `clinical_access` | Igual que la historia clínica: es la evidencia de quién la consultó | No |
| Autorización del paciente | campo `dataConsent` del paciente y su evento | Igual que el paciente | No: es la prueba de la autorización |
| Personal de la IPS | `staff` | Mientras trabaje en la IPS | **Sí, anonimización** al eliminar el usuario en Clerk (nombre y correo a nulo, sin membresías); queda el id seudónimo para la auditoría |
| Inventario y entregas de farmacia | `pharmacy_*` | Mientras la IPS opere; las entregas ligadas a una fórmula siguen el plazo de la historia | No para entregas |
| Logs de la API | Grafana Cloud (Loki) | Según el plan contratado (el gratuito retiene pocos días); no contienen datos de salud | Los gestiona el proveedor |

**Al terminar la operación de una IPS** debe definirse un custodio de las historias por el resto del plazo y entregarles una copia exportada; no se borran al cerrar la organización. (Hoy eliminar una organización la marca como eliminada y **no borra** sus historias; qué custodio las recibe es una decisión pendiente de la IPS.)

## 3. Solicitudes del titular (Ley 1581 de 2012)

| Solicitud | Qué se hace | Plazo de respuesta |
|---|---|---|
| **Consultar** sus datos | La IPS lee la ficha y su historia desde el sistema (un médico o administración según el permiso) y le entrega copia | 10 días hábiles (prorrogable 5 más, con aviso) |
| **Actualizar o corregir** | Editar la ficha (queda en el historial quién y cuándo, y el valor anterior); el contenido clínico se corrige con una **nota aclaratoria**, no se reescribe | 15 días hábiles |
| **Revocar la autorización o suprimir** | Se evalúa si hay deber legal de conservar (en una historia clínica casi siempre lo hay); se responde por escrito con la razón. Si no hay deber, se anonimiza | 15 días hábiles |

Cada solicitud y su respuesta se registran fuera del sistema por la IPS (por ahora no hay módulo de solicitudes).

## 4. Respaldos y recuperación

**Objetivos propuestos** (a validar con la IPS): pérdida máxima de datos (RPO) de **24 horas** y tiempo de recuperación (RTO) de **4 horas**.

| Qué se respalda | Cómo | Estado |
|---|---|---|
| Base de datos (todas las colecciones) | Copias del proveedor en MongoDB Atlas (instantáneas programadas). **Verificar en la consola que el nivel del clúster las incluya**; los clústeres gratuitos no las ofrecen y requieren `mongodump` manual | Por confirmar en Atlas |
| Identidad (usuarios, organizaciones, membresías) | Clerk es la fuente; la API se reconcilia sola al arrancar y cada 10 minutos (`pnpm clerk:sync` carga todo de nuevo) | Implementado |
| Configuración del despliegue | `deploy/pi/` (compose y script) y el `.env` de la Pi; los secretos no están en el repositorio | Implementado (guardar copia de los secretos en un gestor de contraseñas) |
| Código | GitHub | Implementado |

### Procedimiento de restauración

1. Declarar el incidente y avisar a las IPS (quién: el encargado; en el mismo día).
2. En MongoDB Atlas, restaurar la instantánea más reciente en un clúster nuevo (o, sin instantáneas, `mongorestore` de la última copia de `mongodump`).
3. Cambiar `MONGO_URL` (y `MONGO_DB_NAME` si cambió) en el `.env` de la Pi y recrear el contenedor (`docker compose up -d --force-recreate api`).
4. Ejecutar `pnpm clerk:sync` para reconciliar personal e IPS con Clerk.
5. Comprobar `GET /api/v1/health` (`database: up`) y abrir un paciente, su historial y una consulta de prueba en la organización DEV.
6. Revisar `trace_events`: al ser solo de agregar, permite reconstruir el estado de un paciente si su documento se perdió (se hizo una vez en la migración desde PostgreSQL, con `api/src/scripts/recover-from-timeline.ts`).
7. Documentar el incidente: causa, datos perdidos (hasta el RPO) y acciones.

### Prueba de restauración (por registrar)

| Fecha | Quién | Origen de la copia | Resultado | Tiempo |
|---|---|---|---|---|
| | | | | |

Una política de respaldos solo vale si la restauración se probó: la primera prueba debe hacerse **antes de cargar datos reales** y repetirse cada 6 meses.

## 5. Revisión

Esta política se revisa cada 12 meses y cuando cambie un proveedor, el esquema de datos o la norma.
