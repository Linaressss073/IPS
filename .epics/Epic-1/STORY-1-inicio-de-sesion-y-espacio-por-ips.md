# Historia 1: Inicio de sesión y espacio de trabajo por IPS

> Como integrante del personal de una IPS, quiero entrar con mi cuenta y trabajar dentro de mi institución para que
> solo vea y modifique los datos de mi IPS.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: es la puerta de entrada del sistema y ya está en producción.

## Contexto

El sistema es un SaaS que atiende a varias IPS a la vez. Cada persona del personal pertenece a una o más IPS y, al
entrar, trabaja dentro de una de ellas. Esta historia entrega el inicio de sesión, la elección de la IPS y la
garantía de que los datos de una IPS nunca se ven desde otra.

## Entregabilidad

La aplicación queda completa y coherente: se puede entrar, elegir la IPS y llegar a su tablero.

## Alcance

### Incluye

- Página pública de presentación con modo claro y oscuro.
- Registro e inicio de sesión en español.
- Elegir una IPS existente o crear una nueva; quien la crea queda como administrador.
- Tablero de la IPS elegida y cambio entre IPS.
- Rechazo de cualquier acceso a una IPS de la que no se es miembro.

### No incluye

- Datos legales de la IPS (Historia 2).
- Roles funcionales y permisos por pantalla (Historia 4).
- Recuperación de contraseña o doble factor propios: los da el proveedor de identidad.

## Criterios de aceptación

- [ ] **Dado que** soy un visitante sin sesión, **cuando** abro el sistema, **entonces** veo la página de
      presentación y la opción de iniciar sesión o registrarme.
- [ ] **Dado que** no he iniciado sesión, **cuando** intento abrir una página del tablero, **entonces** me lleva a
      iniciar sesión y, al terminar, vuelvo al tablero.
- [ ] **Dado que** inicié sesión y pertenezco a dos IPS, **cuando** elijo una, **entonces** todo lo que veo
      (pacientes, agenda, turnos…) es solo de esa IPS.
- [ ] **Dado que** no pertenezco a la IPS "Clínica B", **cuando** intento abrir su tablero o consultar sus datos,
      **entonces** el sistema me niega el acceso.
- [ ] **Dado que** un dato existe en la IPS "Clínica B", **cuando** lo busco desde la IPS "Clínica A",
      **entonces** el sistema responde como si no existiera.
- [ ] **Dado que** creo una IPS nueva, **cuando** termino, **entonces** quedo como su administrador y llego a su
      tablero.

## Estados de error y vacíos

- Sin IPS: se invita a crear una o a pedir una invitación.
- Sesión vencida: se vuelve a iniciar sesión sin perder la página de destino.
- Servidor no disponible: mensaje de error en la página, sin pantalla en blanco.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Identificador de la IPS | El id de la organización de Clerk, visible en la dirección del tablero. |
| Recurso de otra IPS | Se trata como inexistente (no revela que existe). |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Proveedor de identidad | Clerk; cada IPS es una organización. |
| Aislamiento entre IPS | Toda operación exige ser miembro de la IPS. |
| Idioma | Español (es-MX). |

## Áreas que cambia

La página de presentación, el inicio de sesión y registro, la selección de IPS y el tablero.

## Áreas que no debe cambiar

La configuración de la IPS (Historia 2) y la gestión del personal (Historias 3 y 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] No hay errores nuevos en la consola del navegador.
- [ ] Los flujos que ya funcionaban siguen funcionando.
- [ ] Hay pruebas automáticas que demuestran el rechazo a quien no es miembro.

## Pasos de verificación

1. Abrir el sistema sin sesión y comprobar la página de presentación en modo claro y oscuro.
2. Registrarse, crear la IPS "Clínica Prueba" y comprobar que se llega a su tablero.
3. Con otra cuenta que no pertenece a esa IPS, pegar la dirección de su tablero y comprobar el rechazo.
4. Invitar a la segunda cuenta a la IPS y comprobar que ahora sí entra.
5. Cerrar sesión, abrir el tablero directamente y comprobar que pide iniciar sesión y luego vuelve.

## Evidencia

Commits `0868629`, `98a9dbd` (Clerk), `b6ba341` (español), `024010c` y `040f538` (landing y estilo).
Pruebas: `api/test/staff.e2e-spec.ts`, `api/test/organizations.e2e-spec.ts`.
