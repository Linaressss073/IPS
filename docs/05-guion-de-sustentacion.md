# Guion de sustentación (19-nov-2026)

[← Índice](README.md)

Qué dejar listo esta noche, en qué orden mostrar el sistema y qué responder a las observaciones del docente.

## 1. Estado de producción (decirlo claro)

La API de Render quedó **suspendida por agotar las 750 horas gratuitas del mes** («Free usage limit reached»; ver [README](../README.md#que-la-api-no-se-duerma-plan-gratuito)). Se reanuda al próximo ciclo o subiendo el plan. Por eso la demo se hace **en local**, con el mismo código, y la evidencia de producción se muestra con capturas y con el CI/Sonar, que no dependen de Render.

## 2. Dejar la demo local lista (30 min, esta noche)

Requisitos: Docker Desktop abierto y sesión en Clerk.

1. **Secreto de Clerk** (el único dato que falta; es privado): Clerk → app IPS → instancia **Development** → *API keys* → *Reveal Secret Key*. Pegarlo en dos archivos que **no** se suben a git:
   - `api/deployment/secrets.dev.json` → `"CLERK_SECRET_KEY": "sk_test_…"`
   - `multi-tenant-starter-template/.env.local` → `CLERK_SECRET_KEY=sk_test_…` (el resto de ese archivo ya está completo)
2. Tres terminales:
   ```bash
   cd api && pnpm db:up && pnpm start:dev          # API  → http://localhost:3001/api/v1/docs
   cd multi-tenant-starter-template && pnpm dev    # Web  → http://localhost:3000
   ```
3. Entrar a `http://localhost:3000`, iniciar sesión y elegir la organización **DEV**.
4. En **Personal** asignar roles a los miembros de DEV: uno **médico**, uno de **agendamiento/admisión**, uno de **farmacia**, y la administración (rol admin de Clerk). Sin roles no se ven las pantallas del flujo.
5. **Ensayar una vez completo** (sección 3) y dejar abierto en otras pestañas: Swagger local, GitHub Actions, SonarCloud y las capturas de Clerk.

Nota: la base local arranca vacía; se crea el paciente en vivo. MongoDB en Docker es un conjunto de réplicas (las transacciones lo exigen).

## 3. Recorrido de la demo (≈ 10 min)

| # | Qué mostrar | Qué demuestra |
|---|---|---|
| 1 | Registrar paciente marcando **autorización de datos** | Ley 1581: queda quién y cuándo |
| 2 | **Agendar** una cita (agendamiento) | Agenda y cupos |
| 3 | **Admisión**: registrar llegada → aparece el turno; abrir la **pantalla de sala** en otra ventana | Turnos y llamado con voz; aviso si el sonido está apagado |
| 4 | **Médico**: llamar, escribir consulta y **firmar** con fórmula; intentar editar → rechazo; agregar nota aclaratoria | Historia clínica inmutable |
| 5 | **Farmacia**: entrega parcial y luego completa | Inventario y fórmula |
| 6 | Con **agendamiento**, intentar abrir una consulta → denegado; como **admin**, abrir *Registro de accesos* (`/api/v1/docs` → `clinical-access`) | Mínimo privilegio y trazabilidad de lecturas |
| 7 | Swagger local con los dos esquemas de autenticación | API documentada |

## 4. Respuestas a las observaciones del docente

**Pruebas y validación con usuarios**
- 97 pruebas unitarias, 65 e2e con MongoDB real en contenedor y 34 del frontend; cobertura **88 %** y *quality gate* de Sonar aprobado (0 bugs, 0 vulnerabilidades, 0 *code smells*). Detalle: [01 · Pruebas](01-pruebas-y-evidencia.md).
- El CI es una cadena: **nada se despliega si algo falla**.
- Revisión de accesibilidad con 8 hallazgos corregidos (contraste, etiquetas, lectores de pantalla).
- **Validación con usuarios:** el protocolo está diseñado ([02](02-validacion-con-usuarios.md)). **Decir la verdad:** si no se ejecutaron las sesiones, presentarlo como el siguiente paso, no como hecho. Si hay tiempo mañana antes de sustentar, hacer 2 o 3 sesiones cortas y llevar los resultados.

**Seguridad y protección de datos de salud** — [03](03-proteccion-de-datos.md) y [04](04-conservacion-y-respaldos.md)
- Aislamiento entre IPS, permisos por rol (la historia clínica solo para médicos), historial de eventos solo-agregar, **registro de quién lee cada historia**, autorización del titular, cabeceras de seguridad, límite de peticiones, logs sin datos de salud y política de conservación (20 años desde la última atención).
- Brechas declaradas: Clerk de producción sin desplegar, copias de seguridad por confirmar en Atlas, sin pruebas de penetración.

**Entregar con tiempo**
- Backlog, sprints y trazabilidad commit-historia en Jira desde el primer commit; documentar el aprendizaje: la API se suspendió por no configurar la pausa del monitor y quedó registrado en el README.

## 5. Si algo falla mañana

| Falla | Qué hacer |
|---|---|
| La web local no inicia sesión | Revisar `CLERK_SECRET_KEY` en `.env.local` y reiniciar `pnpm dev` |
| La API no arranca | `pnpm db:up` (Docker abierto) y revisar `secrets.dev.json` |
| Sin internet | La demo necesita Clerk (sesión); tener las capturas de Clerk, el CI y Sonar como respaldo |
| Piden ver producción | Mostrar capturas y explicar la suspensión por cuota; no insistir con la URL de Render |
