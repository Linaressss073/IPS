# Historia 3: Directorio del personal sincronizado y protegido

> Como integrante del personal, quiero ver quiénes trabajan en mi IPS y que el historial muestre sus nombres para
> saber quién hizo cada cosa, sin exponer sus datos personales.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: agrega una pantalla nueva y procesos internos de sincronización.

## Contexto

Las cuentas del personal viven en el proveedor de identidad. El sistema necesita una copia mínima para mostrar
nombres en el historial y en las listas sin consultar al proveedor cada vez, y debe cumplir la Ley 1581 de 2012:
guardar lo mínimo, ofuscar el correo y anonimizar a quien se elimina.

## Entregabilidad

Completa: el directorio se llena solo y se mantiene al día.

## Alcance

### Incluye

- Lista del personal de la IPS con nombre y correo enmascarado.
- Actualización automática cuando alguien se registra, cambia su nombre, entra o sale de la IPS.
- Revisión periódica que corrige lo que no llegó (incluidas bajas).
- Carga inicial de todo el personal que ya existía.
- Anonimización de quien se elimina: el historial muestra "Usuario eliminado".

### No incluye

- Editar datos personales desde el sistema (se hace en la cuenta del proveedor).
- Roles funcionales (Historia 4).

## Criterios de aceptación

- [ ] **Dado que** soy miembro de la IPS, **cuando** abro "Personal", **entonces** veo a cada persona con su nombre y
      su correo enmascarado (p. ej. `and****@cli***.c**`), nunca el correo completo.
- [ ] **Dado que** una persona fue invitada y aceptó, **cuando** abro "Personal" poco después, **entonces** aparece
      en la lista sin que nadie haga nada.
- [ ] **Dado que** una persona cambió su nombre en su cuenta, **cuando** veo el historial de un paciente donde actuó,
      **entonces** aparece con el nombre nuevo.
- [ ] **Dado que** una cuenta fue eliminada, **cuando** veo el historial donde actuó, **entonces** aparece
      "Usuario eliminado" y ya no figura en el personal.
- [ ] **Dado que** un aviso de cambio llegó tarde y con datos viejos, **cuando** se procesa, **entonces** no
      reemplaza los datos más recientes ni revive a un usuario eliminado.
- [ ] **Dado que** se perdió un aviso de baja, **cuando** pasa la revisión periódica, **entonces** la baja se aplica
      igual.
- [ ] **Dado que** no soy miembro de la IPS, **cuando** intento ver su personal, **entonces** se me niega.

## Estados de error y vacíos

- IPS sin más personal: la lista muestra solo a quien la consulta.
- Persona sin nombre en su cuenta: se muestra su nombre de usuario; si tampoco tiene, "Sin nombre".

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Avisos del proveedor | Se aceptan solo con firma válida y no se registran en el log (solo el tipo). |
| Orden de avisos | Cada cambio guarda la fecha del proveedor; uno más viejo no pisa uno más nuevo. |
| Nombres en el historial | Se resuelven al leer, no se copian: anonimizar oculta a la persona en todo el historial. |
| Revisión periódica | Al arrancar y cada 10 minutos (configurable; 0 la apaga). |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Datos del personal | Solo id, nombre y e-mail enmascarado. |
| Derecho al olvido | Anonimización con id seudónimo. |
| Sincronización | Webhooks firmados + reconciliación periódica. |

## Requisitos de consistencia

Mismo tablero y estilo que la Historia 1.

## Áreas que cambia

La página "Personal" y los nombres que aparecen en todo historial.

## Áreas que no debe cambiar

La asignación de roles (Historia 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Ningún correo completo, teléfono ni foto queda guardado en la base de datos.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Invitar a una persona a la IPS y comprobar que aparece en "Personal" con el correo enmascarado.
2. Cambiar su nombre en su cuenta y comprobar el cambio en la lista.
3. Hacer que registre un paciente; luego eliminar su cuenta y comprobar "Usuario eliminado" en el historial.
4. Con la API detenida, sacar a alguien de la IPS; arrancar la API y comprobar que desaparece de la lista.

## Evidencia

Commits `937a0b1`, `a847b70`, `dbca2c4`, `7ed609d`. Pruebas: `api/test/staff.e2e-spec.ts`,
`api/test/clerk-reconciliation.e2e-spec.ts` y unitarios del contexto `staff`.
