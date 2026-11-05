# ADR: Modelo de permisos: pantalla de sala, datos de la IPS y turnos de farmacia

## Status

Accepted

## Date

2026-11-04

## Context

- "Pantalla de sala" y "Datos de la IPS" eran visibles y abiertos para cualquier miembro de la IPS (la API los dejaba en `TeamScoped`).
- El televisor de la sala necesita su propia cuenta con acceso mínimo.
- Farmacia tenía `turns:call`, lo que le abría toda la pantalla de Turnos, incluidos los turnos de las citas; solo necesita los suyos.
- La guía técnica y las pruebas e2e exigen que cada rol vea solo lo que usa.

## Options Considered

### Option 1: Solo ocultar en el menú

- **Description**: Quitar los ítems del menú sin cambiar la API.
- **Pros**: Cambio mínimo.
- **Cons**: Quien conozca la dirección sigue accediendo; la seguridad no cambia.

### Option 2: Permiso y rol nuevos, con control en la API y en el menú

- **Description**: Permiso `room:view` (administrador y rol `tv`); `GET /turns/board` lo exige; `GET /organizations/:teamId` solo para administrador; farmacia pierde `turns:call` y, con `pharmacy:dispense`, solo lista, llama y atiende turnos de origen `farmacia`.
- **Pros**: La regla vive en la API; el menú, las tarjetas y las rutas del frontend la reflejan.
- **Cons**: Más superficie de permisos para probar.

## Decision

Opción 2. Detalles:
- `PermissionGuard` guarda los permisos del llamante en la petición (`CurrentPermissions`), de modo que los controladores no los consultan otra vez.
- Un turno de otro origen aparece como inexistente para farmacia (404 `TURN_NOT_FOUND`), para no revelar que existe.
- La lista de permisos "sin restricción" difiere por ruta a propósito: admisión puede listar y cerrar como "no se presentó", pero solo `turns:call` llama.

## Consequences

### Benefits

- Cada rol ve y abre solo lo suyo, con pruebas e2e por rol (administrador, médico, farmacia, `tv`).
- La TV de la sala usa una cuenta sin acceso a datos clínicos ni administrativos.

### Trade-offs and Limitations

- Quien hoy usa la pantalla de sala con una cuenta normal deja de verla hasta recibir el rol `tv`.
- Hay que crear y mantener la cuenta de la TV en cada IPS.
- Falta probar el menú y las rutas con un usuario de cada rol en la web desplegada.

## Adoption Impact

- `adoption/tech/architecture.md`: registrar el modelo de permisos y su ubicación (`staff/domain/constants/permissions.ts`).
- Guía técnica de la API (`technical-api/README.md`, `03-staff.md`, `07-admission.md`): ya actualizada con la nueva matriz.
