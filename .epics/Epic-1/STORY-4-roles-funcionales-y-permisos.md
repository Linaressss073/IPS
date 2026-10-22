# Historia 4: Roles funcionales y permisos

> Como administrador de una IPS, quiero asignar roles funcionales a cada persona para que solo pueda ver y hacer lo
> que corresponde a su trabajo.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*. Al desplegarse, las personas sin rol funcional solo ven lo que cualquier miembro ve;
el administrador debe asignar roles antes de que el personal opere.

## Contexto

En la consulta externa trabajan perfiles distintos: quien agenda, quien admite, el médico, el farmacéutico y el
soporte. No todos deben ver lo mismo: por ejemplo, solo el médico lee notas clínicas. Esta historia permite al
administrador asignar roles y hace que la aplicación muestre y permita solo lo que cada rol autoriza.

## Entregabilidad

Completa. Las personas que existían antes de los roles quedan sin rol funcional hasta que el administrador se lo
asigne; es una decisión consciente.

## Alcance

### Incluye

- Asignar uno o varios roles (agendamiento, admisión, médico, farmacia, soporte) a cada persona.
- Ver mis propios roles y permisos.
- Menú y acciones visibles según los permisos.
- Rechazo con mensaje claro de cualquier acción sin permiso.
- Registro de cada cambio de roles: quién lo hizo, a quién y qué roles quedaron.

### No incluye

- Roles personalizados creados por la IPS.
- Permisos por paciente o por servicio.

## Criterios de aceptación

- [ ] **Dado que** soy administrador, **cuando** asigno a una persona los roles "admisión" y "farmacia",
      **entonces** su lista de roles muestra ambos y el cambio queda registrado con mi nombre.
- [ ] **Dado que** tengo solo el rol "farmacia", **cuando** entro al tablero, **entonces** veo Farmacia, Inventario
      y Turnos, pero no Agenda ni Consultas.
- [ ] **Dado que** no tengo el rol "médico", **cuando** intento abrir una historia clínica, **entonces** el sistema
      me indica que no tengo permiso.
- [ ] **Dado que** no soy administrador, **cuando** intento cambiar los roles de alguien, **entonces** el sistema me
      lo impide.
- [ ] **Dado que** asigno un rol que no existe, **cuando** guardo, **entonces** el sistema lo rechaza.
- [ ] **Dado que** la persona no pertenece a la IPS, **cuando** intento asignarle roles, **entonces** el sistema
      indica que no la encuentra.

## Estados de error y vacíos

- Persona sin roles: se muestra "Sin roles" y su menú solo tiene lo básico.
- Sin permiso: mensaje "No tienes permiso para esta acción", nunca una pantalla en blanco.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Matriz de permisos | Fija por rol (ver `technical-api/README.md`); el administrador no lee notas clínicas ni dispensa. |
| Varios permisos válidos | Una acción puede aceptar cualquiera de varios permisos (p. ej. la lista de turnos). |
| Roles en documentos antiguos | Se tratan como lista vacía. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Administrador | Solo el rol `admin` de Clerk asigna roles. |
| Roles funcionales | Agendamiento, admisión, médico, farmacia, soporte; varios por persona. |

## Requisitos de consistencia

La gestión de roles vive en la misma página "Personal" de la Historia 3.

## Áreas que cambia

La página "Personal" (asignación), el menú del tablero y el control de cada acción del sistema.

## Áreas que no debe cambiar

La ficha de la IPS (Historia 2).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Cada acción del sistema declara qué permiso exige.
- [ ] Los flujos que ya funcionaban siguen funcionando para quien tiene el rol adecuado.

## Pasos de verificación

1. Como administrador, asignar a una persona solo "farmacia".
2. Entrar con esa persona y comprobar qué menús ve.
3. Intentar abrir directamente la dirección de una consulta y comprobar el mensaje de permiso.
4. Agregarle "médico" y comprobar que ahora ve Consultas.
5. Revisar que el cambio de roles quedó registrado con el nombre del administrador.

## Evidencia

Commits `8f10e9c`, `dbca2c4`. Pruebas: `api/test/staff.e2e-spec.ts` y las pruebas de permisos de cada módulo.
