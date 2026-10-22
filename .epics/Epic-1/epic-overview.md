# Épica 1: Plataforma multi-IPS, acceso y personal

## Objetivo

Dar a cada IPS un espacio propio y aislado dentro del sistema: su personal entra con su cuenta, solo ve los datos de su
institución y solo puede hacer lo que su rol le permite. Es la base sobre la que se apoyan pacientes, agendamiento,
admisión, consulta y farmacia: sin ella no hay a quién atribuirle una acción ni forma de separar los datos de dos IPS.

La identidad (inicio de sesión, usuarios, organizaciones) la gestiona Clerk; el sistema guarda la ficha legal de la IPS
(NIT, código REPS, contacto) y un directorio **mínimo y ofuscado** del personal, como pide la Ley 1581 de 2012 (Habeas
Data). Los roles funcionales (agendamiento, admisión, médico, farmacia, soporte) los asigna el administrador y definen
qué pantallas y acciones ve cada persona.

**Estado:** implementada (commits del 1 y 2 de octubre de 2026).

## Documentos de referencia

- `README.md` (raíz) y `api/README.md`: lenguaje ubicuo, contextos delimitados, privacidad del personal.
- `technical-api/README.md` (autenticación, multi-tenancy y matriz de permisos), `03-staff.md`, `04-organizations.md`,
  `05-webhooks.md`.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Proveedor de identidad | Clerk: cada IPS es una *organización* de Clerk y su id es el identificador de la IPS en todo el sistema. |
| Aislamiento entre IPS | Toda operación de negocio va dentro de una IPS y exige ser miembro; un recurso de otra IPS se comporta como inexistente. |
| Administrador | El rol `admin` de Clerk. Solo él edita o elimina la IPS y asigna roles. |
| Roles funcionales | Agendamiento, admisión, médico, farmacia y soporte; una persona puede tener varios. Cada rol da permisos fijos (ver matriz en `technical-api/README.md`). |
| Datos del personal | Solo id, nombre y e-mail enmascarado (`and****@cli***.c**`). Nunca e-mail completo, teléfono ni foto. |
| Derecho al olvido | Un usuario eliminado en Clerk se anonimiza; la auditoría conserva solo su id seudónimo y muestra "Usuario eliminado". |
| Sincronización con Clerk | Webhooks firmados + reconciliación automática al arrancar y cada 10 minutos, incluidas las bajas. |
| Eliminar una IPS | Elimina la organización en Clerk y deja una lápida; nunca borra pacientes ni historial. |
| Idioma | Interfaz y mensajes en español (Clerk en es-MX). |

## Orden de las historias

### Historia 1: Inicio de sesión y espacio de trabajo por IPS

**Prioridad**: sin sesión ni IPS activa ninguna otra historia es usable.
El personal entra con su cuenta, elige (o crea) su IPS y llega al tablero de esa IPS. La landing pública presenta el
sistema con la paleta de salud y modo claro/oscuro. Todo lo que ve después pertenece solo a esa IPS.
**Dependencias**: ninguna.

### Historia 2: Ficha de la IPS

**Prioridad**: los datos legales de la IPS (NIT, REPS) identifican a la institución en todo documento posterior.
El administrador ve y edita nombre, NIT con dígito de verificación, código de habilitación REPS y datos de contacto;
también puede eliminar la IPS sin perder la información clínica.
**Dependencias**: Historia 1.

### Historia 3: Directorio del personal sincronizado y protegido

**Prioridad**: la trazabilidad necesita nombres para mostrar quién hizo qué.
Los miembros ven el personal de su IPS con nombre y e-mail enmascarado. El directorio se mantiene al día solo (altas,
cambios y bajas en Clerk) y anonimiza a quien se elimina.
**Dependencias**: Historia 1.

### Historia 4: Roles funcionales y permisos

**Prioridad**: separa quién agenda, admite, atiende y dispensa antes de construir esos módulos.
El administrador asigna uno o varios roles a cada persona; cada quien ve solo los menús y acciones de sus roles y el
sistema rechaza lo demás con un mensaje claro.
**Dependencias**: Historia 3.

## Contexto compartido para el detalle de historias

- **Identidad y acceso (API):** `api/src/contexts/identity-access/` (verificación del token, guardas `@TeamScoped`,
  `@TeamAdmin`, permisos), `api/src/shared/application/ports/team-members.port.ts`.
- **IPS:** `api/src/contexts/organizations/` (`organization.entity.ts`, `update-organization.command.ts`,
  `delete-organization.command.ts`, `organizations.controller.ts`).
- **Personal:** `api/src/contexts/staff/` (`assign-staff-roles.command.ts`, `apply-identity-change.command.ts`,
  `staff.controller.ts`).
- **Integración Clerk:** `api/src/integrations/clerk/` (`clerk-webhook.controller.ts`, `clerk-reconciler.ts`),
  `api/src/scripts/` (carga masiva `clerk:sync`).
- **Frontend:** `multi-tenant-starter-template/middleware.ts`, `app/sign-in`, `app/sign-up`, `app/(landing-page)`,
  `app/dashboard/[teamId]/layout.tsx`, `app/dashboard/[teamId]/settings`, `app/dashboard/[teamId]/staff`,
  `components/access/access-context.tsx`, `lib/api/staff.ts`, `lib/api/use-api-auth.ts`.
- **Pruebas:** `api/test/organizations.e2e-spec.ts`, `api/test/staff.e2e-spec.ts`,
  `api/test/clerk-reconciliation.e2e-spec.ts`.
