# Seguridad y protección de datos de salud

[← Índice](README.md)

Los datos de una consulta externa (identidad del paciente, diagnósticos, fórmulas) son **datos personales sensibles**. Este documento dice qué controles tiene el sistema, qué norma respalda cada uno y qué falta. Todo lo marcado como implementado existe en el código y, donde se indica, tiene prueba automática.

> La redacción de las normas es una síntesis técnica para el proyecto académico; antes de usarla en un contexto legal debe revisarla un asesor jurídico.

## 1. Marco normativo (Colombia)

| Norma | Qué exige en lo que toca al sistema |
|---|---|
| **Ley 1581 de 2012** (protección de datos personales / *Habeas Data*) y su reglamentación (Decreto 1377 de 2013, hoy compilado en el Decreto 1074 de 2015) | Los datos de salud son **sensibles**: tratamiento restringido, autorización del titular, finalidad definida, **minimización**, seguridad y derechos del titular (conocer, actualizar, suprimir) |
| **Resolución 1995 de 1999** (historia clínica) | La historia clínica es reservada, íntegra, secuencial y con **fecha, hora y responsable** de cada registro; solo la conoce quien interviene en la atención o la ley autoriza |
| **Ley 23 de 1981** (ética médica) | La historia clínica es un documento privado sometido a **reserva** |
| **Ley 527 de 1999** | Valor de los mensajes de datos y de la **firma electrónica**, base de firmar la consulta en el sistema |
| **Ley 2015 de 2020** | Historia clínica electrónica interoperable (horizonte del producto; no está implementada la interoperabilidad) |

## 2. Controles implementados

### 2.1 Acceso y confidencialidad

| Principio | Control | Verificación |
|---|---|---|
| Solo entra quien se identificó | Autenticación con Clerk: la API valida el token firmado y su origen autorizado (`azp`) en cada petición | e2e: «rejects requests without a valid token» |
| **Cada IPS ve solo sus datos** (multiinquilino) | Toda colección se consulta por `teamId`; el `teamId` de la ruta debe coincidir con la membresía de quien llama | e2e: «hides patients and timelines of other teams» |
| **Mínimo privilegio** | Matriz de permisos por rol (administración, agendamiento, admisión, médico, farmacia, soporte, TV): 12 permisos, cada endpoint exige uno | Prueba unitaria de la matriz; e2e de roles |
| **Reserva de la historia clínica** | `clinical:read` y `clinical:write` solo para el rol médico: **ni los administradores leen la historia clínica**; solo el médico de la cita escribe la consulta (`NOT_THE_TREATING_PHYSICIAN`) | Prueba unitaria de la matriz |
| La farmacia solo ve lo suyo | Llama solo turnos de origen «farmacia», con `pharmacy:dispense` | e2e de farmacia |
| **Quién leyó la historia queda registrado** | Abrir una consulta, el historial de un paciente o una fórmula guarda quién y cuándo (`clinical_access`, sin contenido clínico); si el registro falla, la lectura falla. Solo administración (`audit:read`) lo consulta | e2e: «logs who opens clinical data…» y «leaves no trace when the access is denied» |
| La TV de sala solo muestra | Rol `tv` con `room:view`, sin acceso a datos clínicos | Prueba unitaria de la matriz |

### 2.2 Integridad y trazabilidad

- **Registro de auditoría append-only** (`trace_events`): cada cambio importante guarda el evento y quién lo hizo **en la misma transacción** que el dato; si una falla, no se guarda ninguna. Eventos: alta y cambios de paciente, citas, turnos, consulta iniciada y firmada.
- **Consulta firmada = inmutable:** una vez firmada solo se agregan **notas aclaratorias** (`CONSULTATION_SIGNED`); no se reescribe. Respalda la exigencia de integridad de la Resolución 1995.
- **Control de concurrencia optimista** (versión en pacientes, citas, turnos, consultas, entregas): dos personas no se pisan datos sin saberlo (`*_VERSION_CONFLICT`).
- **Los nombres no se copian a los eventos:** se resuelven al leer, de modo que anonimizar a una persona la oculta en todo el historial a la vez.

### 2.3 Minimización y derechos del titular

- **Autorización del paciente:** al registrarlo (o después, desde su ficha) se guarda **quién y cuándo** registró que el paciente autorizó el tratamiento de sus datos; es idempotente, editar otros campos no la modifica y queda en el historial (`patient.data_consent_recorded`). Los pacientes anteriores figuran «sin autorización registrada» y la ficha lo avisa. Pruebas: unitarias del agregado y e2e de `patients`.
- **Personal:** se guarda solo el id de Clerk, el nombre para mostrar y el correo **enmascarado** (`and****@cli***.c**`); contraseñas, teléfonos, fotos y el correo completo **nunca llegan a la base**.
- **Derecho a la supresión del personal:** al eliminar un usuario en Clerk se **anonimiza** (nombre y correo a `null`, se borran sus membresías) y se conserva solo un id seudónimo para que la auditoría siga enlazada. Una actualización atrasada no revive los datos.
- **Reconciliación** con Clerk al arrancar y cada 10 minutos, para que una baja que un webhook no trajo se aplique igual.

### 2.4 Transporte, perímetro y secretos

- **HTTPS** por el túnel de Cloudflare (los puertos de la Pi solo escuchan en `127.0.0.1`); la API envía `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` y no expone `x-powered-by` (`helmet`).
- **La web** aplica una política de seguridad de contenido (CSP), `X-Frame-Options` y demás cabeceras desde `next.config.mjs` (prueba: `security-headers.test.ts`).
- **Límite de peticiones** por cliente (429) contra abuso y fuerza bruta.
- **CORS** restringido a los orígenes del frontend configurados.
- **Webhooks de Clerk:** se rechazan si la firma sobre el cuerpo crudo no es válida; el cuerpo no se registra.
- **Sin secretos en el repositorio:** no hay archivos `.env`; los valores vienen del `.env` de la Pi (permisos 600, fuera del repositorio) o del entorno. SonarCloud: 0 vulnerabilidades y 0 *security hotspots*; las acciones de CI están fijadas por SHA.
- **Errores uniformes:** el cliente recibe `code` y mensaje sin trazas internas ni detalles de la base.

### 2.5 Registros (logs) sin datos de salud

Los logs de la API (Grafana Cloud/Loki) llevan método, ruta, estado, id de petición y `teamId`. **No** incluyen cuerpos, cabeceras de autorización ni cookies (se redactan), ni valores de consulta (una búsqueda puede ser el nombre o documento de un paciente), ni el contenido de los webhooks.

## 3. Brechas y plan

| Brecha | Riesgo | Plan |
|---|---|---|
| ~~La API y la web también respondían por `http://`~~ | — | **Resuelto** el 18-nov-2026: «Always Use HTTPS» en Cloudflare; ambos hostnames responden 301 a HTTPS. Solo afecta a los dominios públicos, no al acceso por IP y puerto dentro de la red local |
| La web desplegada usa la instancia de **desarrollo** de Clerk | Límites de uso y sin garantías de producción | IPS-151: instancia de producción antes de datos reales |
| ~~No se registra quién lee una historia clínica~~ | — | **Resuelto** (IPS-170): ver 2.1 |
| ~~No hay captura de la autorización del titular~~ | — | **Resuelto** (IPS-171): ver 2.3. Falta el texto legal de la autorización que la IPS lee al paciente, que debe redactar su asesor |
| ~~Política de conservación y supresión; respaldos~~ | — | **Documentada** (IPS-172): [04 · Conservación y respaldos](04-conservacion-y-respaldos.md). Falta confirmar las copias en Atlas y registrar la primera prueba de restauración |
| **Cifrado en reposo** y **doble factor** dependen de los proveedores | Verificar que estén activos | Confirmar el cifrado del clúster en Atlas y exigir doble factor a los roles con acceso clínico en Clerk |
| Sin pruebas de penetración ni de carga | Vulnerabilidades no detectadas por análisis estático | Ejecutar un escaneo (por ejemplo OWASP ZAP) sobre la API desplegada y registrar el resultado |
| Sin interoperabilidad (Ley 2015 de 2020) | Fuera del alcance actual | Declarado como trabajo futuro |

## 4. Cómo se demuestra en la sustentación

1. En DEV, con un usuario de agendamiento, intentar abrir una consulta: se rechaza (`PERMISSION_DENIED`).
2. Con un token de otra IPS, pedir un paciente de la IPS DEV: no se ve.
3. Mostrar el historial del paciente (`trace_events`) con quién hizo cada cambio.
   Y, como administración, el registro de accesos (`GET /clinical-access?patientId=`): quién abrió la historia y cuándo, sin contenido clínico.
4. Mostrar en Grafana que los logs no contienen datos del paciente.
5. Mostrar las cabeceras de seguridad de `/api/v1/health` en las herramientas del navegador.

## 5. Pruebas de seguridad en producción (18-nov-2026)

Se ejecutaron con [`deploy/pi/smoke-test.sh`](../deploy/pi/smoke-test.sh) contra `https://ips-api.devrojas.xyz` y `https://ips.devrojas.xyz` justo después de desplegar. Son de **solo lectura**, sin token y sin datos reales: **26 de 27 superadas** en la primera ejecución y **27 de 27** tras corregir el hallazgo. El script se repite después de cada despliegue.

| Qué se comprueba | Resultado |
|---|---|
| Cabeceras de la API: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, sin `X-Powered-By` | Superada |
| Cabeceras de la web: `Content-Security-Policy`, `X-Frame-Options`, `nosniff`, sin `X-Powered-By` | Superada |
| Sin sesión, las rutas protegidas responden **401** (pacientes, consultas, accesos clínicos, personal) y el tablero no se abre | Superada |
| Token inválido: `INVALID_ACCESS_TOKEN`; ruta inexistente: `ROUTE_NOT_FOUND`; JSON roto: `BAD_REQUEST`; ninguna respuesta filtra trazas | Superada |
| Webhook de Clerk sin firma válida: **400** (no se procesa) | Superada |
| CORS: permite el origen de la web y **rechaza** un origen ajeno | Superada |
| Límite de peticiones anunciado en las cabeceras `RateLimit` | Superada |
| TLS 1.3 con certificado válido | Superada |
| HTTP sin cifrar redirige a HTTPS | **Hallazgo corregido**: respondía 200 por `http://`; se activó «Always Use HTTPS» en Cloudflare y ahora responde 301 (repetida: superada) |
| Salud estable: 12 de 12 respuestas 200 (media ≈ 0,5 s) | Superada |

**Lo que estas pruebas no cubren** (y dónde se cubre):
- El **429** real no se provoca en producción para no saturarla; se verifica en las pruebas e2e (`security.e2e-spec.ts`).
- El aislamiento entre IPS y los permisos por rol necesitan sesión; están en las pruebas e2e y unitarias (documento 01), no en esta batería.
- No hay prueba de penetración (por ejemplo OWASP ZAP) ni de carga.

**Observabilidad como control.** Grafana Cloud recibe las métricas y logs de la API de la Pi (se comprobó con el tráfico de estas pruebas: peticiones por ruta, éxito del 100 %, logs por nivel). Las rutas aparecen como **plantilla** (`/teams/:teamId/clinical-access`), nunca con ids reales. Al revisarlo se encontró un defecto: la latencia (p50/p95/p99) era inválida porque el histograma usaba rangos pensados para milisegundos con valores en segundos; se corrigió con rangos de 5 ms a 10 s y una prueba que lo verifica.
