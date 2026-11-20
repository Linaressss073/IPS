# Guion de exposición, sección por sección

[← Índice](README.md)

Para exponer con la [demo interactiva](demo/IPS-proyecto.html). Sigue el orden de la página (menú de arriba). Duración total: **15 a 18 minutos**. Las cifras son las de la página (18-nov-2026); si algo cambia, la página manda.

**Antes de empezar:** abrir la demo en pantalla completa, tener `https://ips.devrojas.xyz` abierto en otra pestaña (por si piden verlo en vivo) y una terminal en la raíz del repositorio. Hablar en «nosotros».

| # | Sección | Tiempo | Quién habla de qué |
|---|---|---|---|
| 1 | Portada | 1:00 | Qué es y las cifras |
| 2 | El problema | 2:00 | Por qué existe el software |
| 3 | La plataforma funcionando | 1:30 | Capturas reales |
| 4 | Guion y recorrido real | 3:00 | El flujo de punta a punta |
| 5 | Explorador de roles | 1:00 | Mínimo privilegio |
| 6 | Pruebas | 2:00 | Evidencia de calidad |
| 7 | Seguridad y datos de salud | 3:30 | Controles, pruebas y hallazgos |
| 8 | Arquitectura y stack | 3:00 | El modelo SaaS multi-tenant y cómo está hecho |
| 9 | Estado y cierre | 1:00 | Lo que falta, sin adornos |

---

## 1. Portada · 1:00

**Mostrar:** el título y las seis cifras.

**Decir:**
- «Es un sistema de información hospitalaria web para la consulta externa: agendamiento, admisión con turnos, consulta médica con firma y fórmula, y farmacia con inventario.»
- «La idea central: un solo registro por paciente en cada IPS, y que cada paso quede trazado: quién lo hizo y cuándo.»
- «Está en producción en `ips.devrojas.xyz`, en una Raspberry Pi propia, con los secretos en Vault y publicada con Cloudflare.»
- Cifras, una frase cada una: **211 pruebas automáticas**, **88 % de cobertura**, **28 de 28 pruebas de seguridad en producción**, **cero incidencias abiertas en Sonar**, **8 contextos de negocio** y **13 permisos** repartidos por rol.

**Pregunta probable:** «¿Por qué una Raspberry Pi?» → «Render gratuito se agotó y suspendió la API (lo contamos más adelante); la Pi está siempre encendida, es nuestra, y el túnel de Cloudflare nos da HTTPS sin abrir puertos.»

**Transición:** «Antes de mostrarlo, el problema que resuelve.»

## 2. El problema · 2:00

**Mostrar:** la sección «El problema»: las dos filas del recorrido (Hoy / Con el sistema), las tres tarjetas, la pregunta y la tabla «Cada dificultad, y cómo la resuelve el sistema».

**Decir:**
- «Antes de mostrar el sistema, el problema que resuelve. En una IPS de mediana complejidad, agendar, tomar turno, admitir, consultar y dispensar funcionan como procesos separados, cada uno con su propio registro.»
- «Eso tiene consecuencias concretas: el documento del paciente se digita **entre tres y cuatro veces** en un mismo recorrido y la fórmula se **transcribe a mano** para que farmacia la atienda. Es lo que observamos directamente en una IPS de mediana complejidad.»
- «No es un problema de las personas: en la E.S.E. Antonio Nariño, Burbano y Montenegro (2010) encontraron que el **57 % del personal** reportaba incumplimiento de la calidad por exceso de trámites, y solo entre el 21 % y el 25 % de los usuarios calificaba como excelente la asignación de citas. Personal y usuarios señalan lo mismo.»
- «Y persiste aunque ya exista historia clínica electrónica: se digitalizó módulo por módulo, sin un flujo continuo. La Ley 2015 de 2020 exige una historia clínica interoperable.»
- «Nuestra pregunta fue: ¿qué características debe tener un sistema para que cada dato se capture **una sola vez**, la atención avance **sin retrocesos ni esperas evitables** y el recorrido quede **trazado de principio a fin**?»
- Recorrer la tabla, una fila por frase: «datos repetidos → un solo registro; fórmula transcrita → fórmula firmada que llega a farmacia; esperas → turnos y pantalla de sala; inventario desconectado → inventario por lote ligado a la entrega; sin trazabilidad → historial que solo se agrega.»
- **Cierre, con honestidad:** «El sistema elimina la recaptura por diseño; lo que todavía no medimos en una IPS real es cuánto se reducen las esperas y los retrocesos. Esa medición es el siguiente paso.»

**Preguntas probables:**
- «¿De dónde salen esos datos?» → «De la observación directa del equipo en una IPS de mediana complejidad —sin usar documentos internos, por confidencialidad— y del estudio de Burbano y Montenegro (2010). No tenemos todavía una medición propia de antes y después.»
- «¿Y la interoperabilidad que exige la ley?» → «Hoy resolvemos la continuidad dentro de la institución; la interoperabilidad entre instituciones es trabajo futuro y lo declaramos así.»

**Transición:** «Con ese problema claro, veamos el sistema funcionando.»

## 3. La plataforma funcionando · 1:30

**Mostrar:** bajar a las capturas; abrir 3 o 4 con clic (página de inicio, inicio de sesión, módulos, Swagger). Probar el filtro «Pruebas y calidad».

**Decir:**
- «Estas son capturas reales de producción, sin datos de pacientes.»
- «Inicio de sesión con Clerk, con Google o correo. Cada institución es una organización aislada.»
- «La API está documentada con Swagger, con todos los campos.»
- «Aquí también están el CI de GitHub y el panel de Sonar: el historial incluye los fallos que corregimos, no los escondimos.»

## 4. Guion y recorrido real · 3:00

**Mostrar:** la lista de 8 pasos y luego la sección **«El recorrido real»**. Pulsar **Reproducir** (cambia solo cada 5 s) o ir capítulo por capítulo. Opción: **Ver animado**.

**Decir (un capítulo por frase):**
1. «La administración registra los datos de la IPS.»
2. «Define el servicio con su prefijo de turno y el consultorio.»
3. «Se registra al paciente. Marcamos la **autorización de tratamiento de datos**: queda quién y cuándo, Ley 1581.»
4. «Si no se marcó, la ficha avisa y permite registrarla después.»
5. «Se abre la agenda del día en cupos de 20 minutos.»
6. «Se agenda y se confirma; no hay choques de horario.»
7. «Llega el paciente, admisión registra la llegada y recibe su turno.»
8. «Se llama el turno; la **pantalla de sala** lo muestra con voz, y avisa en grande si el sonido está apagado.»
9. «El médico firma la consulta con la fórmula; desde ahí es **inmutable**, solo admite notas aclaratorias.»
10. «Farmacia recibe un lote y entrega la fórmula en dos partes; no deja entregar más de lo pendiente.»
11. «Y el historial muestra todo, con quién y cuándo. Ese registro solo se agrega, nunca se edita.»

**Opcional en vivo (30 s):** abrir `ips.devrojas.xyz` y mostrar que es la misma aplicación.

**Pregunta probable:** «¿Esto es producción real?» → «Sí, es la instancia de producción, con una organización de prueba y datos ficticios.»

## 5. Explorador de roles · 1:00

**Mostrar:** pulsar **Médico**, luego **Administración**, luego **Soporte**.

**Decir:**
- «Médico: 5 de 13 permisos; es el **único rol que lee y escribe la historia clínica**.»
- «Administración: 9 de 13. Administra todo menos lo clínico: **ni los administradores leen la historia clínica**.»
- «Soporte: ningún acceso a datos.»
- «Es la matriz real del código, y una prueba unitaria la verifica.»

**Pregunta probable:** «¿Y si alguien tiene dos roles?» → «Recibe la unión de los permisos de sus roles; cada rol se asigna por IPS.»

## 6. Pruebas · 2:00

**Mostrar:** las tres barras, la cadena de CI y las tres tarjetas (Sonar, Accesibilidad, Lo que aún no cubre).

**Decir:**
- «**112 pruebas unitarias, 65 de extremo a extremo y 34 del frontend.** Las de extremo a extremo usan una **base MongoDB real** en un contenedor, con transacciones; solo simulamos a Clerk.»
- «La cadena de CI: lint, compilación, unitarias, e2e, Sonar y la web. Si algo falla, **no se despliega**.»
- «Sonar: 88 % de cobertura, sin bugs, vulnerabilidades ni *code smells*.»
- «Hicimos una revisión de accesibilidad y corregimos ocho hallazgos: contraste de bordes, errores anunciados a lectores de pantalla, campos con nombre.»
- **Sin que lo pregunten:** «Lo que aún no cubrimos: pruebas automáticas de la interfaz de extremo a extremo, y pruebas de carga y de penetración.»

**Pregunta probable:** «¿Por qué no hay pruebas de interfaz?» → «Necesitan iniciar sesión en Clerk con credenciales de prueba guardadas en el CI; está planteado como siguiente historia.»

## 7. Seguridad y datos de salud · 3:30

**Mostrar:** la tabla de controles; luego la sección oscura: la caja del comando, los cinco grupos de pruebas, los hallazgos y las brechas.

**Decir (controles, 1:30):**
- «Son datos personales sensibles. Cada control tiene su norma: Ley 1581 de 2012, Resolución 1995 de 1999 de la historia clínica, la reserva de la Ley 23 y la firma electrónica de la Ley 527.»
- «Aislamiento por IPS; mínimo privilegio; **registro de quién leyó la historia**; autorización del titular; historia inmutable; datos mínimos del personal con derecho al olvido.»
- «Los **secretos viven en OpenBao**, el Vault de código abierto; un script los trae al arrancar y, si el vault falla, no toca la configuración actual.»

**Decir (28 pruebas, 1:00):**
- «Este script, de solo lectura, se ejecuta contra producción en unos 40 segundos: cabeceras, 401 sin sesión, errores sin trazas, CORS, webhook sin firma, HTTPS y TLS.» **Opcional en vivo:** `bash deploy/pi/smoke-test.sh`.

**Decir (hallazgos, 1:00) — es lo más valioso:**
- «Al probar encontramos y corregimos cosas reales: la API respondía por HTTP sin redirigir a HTTPS; **un despliegue nuestro rompió el inicio de sesión** por usar la clave de Clerk de desarrollo; las latencias de Grafana estaban mal medidas; los errores del correo podían exponer una dirección; y la página pública decía «Próximamente» en módulos que ya funcionan.»
- «De ese fallo salió una guarda: el script de despliegue ya aborta con claves de desarrollo.»

**Brechas, sin que lo pregunten:** copias de seguridad de Atlas por confirmar, respaldo del vault, pruebas de penetración y el texto legal de la autorización, que debe redactar un asesor jurídico.

**Pregunta probable:** «¿Es seguro para datos reales?» → «Tiene los controles básicos y la evidencia, y declaramos qué falta antes de operar con una IPS real: respaldos probados, penetración y revisión jurídica.»

## 8. Arquitectura y stack · 3:00

**Mostrar:** las cinco capas, luego «Stack de negocio: SaaS multi-tenant» (cuatro tarjetas) y después «Stack técnico» (seis tarjetas).

**Decir (primero el negocio, 1:00):**
- «El producto es **SaaS multi-tenant**: una sola instalación atiende a muchas IPS, y **cada IPS es un tenant**, una organización aislada con su personal, sus roles, su configuración y sus datos.»
- «El tenant es la organización de Clerk y viaja como `teamId` en cada ruta y cada consulta; el de la ruta debe coincidir con la membresía de quien llama, y una prueba e2e lo comprueba entre dos IPS.»
- «Una persona puede estar en varias IPS con roles distintos en cada una: 7 roles y 13 permisos que asigna la administración de cada IPS.»
- **Con honestidad:** «Los planes y el cobro por suscripción no están implementados; el alcance es el prototipo del servicio.»

**Decir (después lo técnico, 2:00):**
- «Una API con **un contexto por área de negocio** (ocho) y comandos separados de consultas; una web que solo habla con esa API.»
- «Datos en MongoDB Atlas con réplica y transacciones: el dato y su evento de auditoría se guardan juntos o no se guarda ninguno.»
- «Stack: **Next.js 15 y React 19** en la web; **NestJS 12 sobre Node 24 con TypeScript** en la API; Clerk para identidad —**no guardamos contraseñas**—; OpenBao para secretos; Grafana Cloud para métricas y logs.»
- «Infraestructura pequeña y reproducible: Docker en una Raspberry Pi y Cloudflare Tunnel.»
- Cierre de la sección: «Los cuatro «por qué»: un solo lenguaje, historia consistente, sin contraseñas propias y secretos fuera del código.»

**Preguntas probables:**
- «¿Cómo se garantiza que una IPS no vea los datos de otra?» → «Todo se consulta por `teamId`, el de la ruta se valida contra la membresía y hay una prueba e2e entre dos IPS.»
- «¿Por qué MongoDB y no SQL?» → «Los documentos encajan con la ficha y la consulta; usamos transacciones para lo que debe ser atómico. Antes usamos PostgreSQL y lo migramos; la auditoría append-only permitió reconstruir el estado.»

## 9. Estado y cierre · 1:00

**Mostrar:** las dos tarjetas «Listo» y «Falta validar», y la tabla de URLs.

**Decir:**
- «Listo: el flujo completo ejecutado en producción, roles y aislamiento, registro de lecturas, autorización del titular, producción con Clerk de producción y HTTPS, y 28 pruebas de seguridad.»
- «Falta: pruebas automáticas de la interfaz, copias de Atlas y respaldo del vault, pruebas de penetración y completar el correo al paciente.»
- Cierre: «El sistema funciona, está probado y vigilado, y sabemos exactamente qué falta antes de operar con una IPS real. Quedamos atentos a sus preguntas.»

---

## Si preguntan por lo que no está en la página

- **¿Y la validación con usuarios?** Respuesta honesta: «Está diseñado el protocolo de usabilidad (tareas por rol y cuestionario SUS, en `docs/02-validacion-con-usuarios.md`), pero **todavía no hicimos las sesiones con personas reales**. Es el siguiente paso.» No decir que se hizo.
- **¿Cuánto cuesta operarlo?** La Pi es propia; los servicios (Atlas, Clerk, Cloudflare, Grafana) están en planes gratuitos; Render se abandonó por la cuota.
- **¿Qué pasa si se cae la Pi?** Es un solo equipo, sin réplicas. Los datos están en Atlas; los secretos, en el vault de la Pi (por eso falta confirmar su respaldo); se reconstruye con `deploy.sh` y `up.sh`.

## Frases que conviene evitar

- «Es 100 % seguro» → «tiene estos controles y esta evidencia».
- «Validamos con usuarios» → no es cierto todavía.

## Si algo falla durante la exposición

| Falla | Qué hacer |
|---|---|
| La demo no abre | Abrir `docs/demo/IPS-proyecto.html` directamente desde el explorador de archivos (no necesita internet) |
| Producción no responde | Seguir con las capturas del recorrido real, que están incrustadas |
| Piden verlo en vivo y no hay sesión | Mostrar `/health`, el panel de Sonar y las capturas |
