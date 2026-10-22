# Historia 1: Autorización de comunicaciones del paciente

> Como auxiliar de admisión, quiero registrar si el paciente autoriza que la IPS le escriba para que solo reciba
> comunicaciones quien las aceptó.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

No requiere *feature flag*: agrega un dato al paciente; nada se envía todavía.

## Contexto

La Ley 1581 de 2012 exige autorización previa para usar los datos de contacto con fines de comunicación. Hoy el
sistema guarda el correo del paciente pero no si autorizó usarlo. Esta historia agrega esa autorización al registro y a
la ficha, y la deja trazada.

## Entregabilidad

Completa: la autorización se ve y se edita aunque aún no se envíen correos.

## Alcance

### Incluye

- Casilla "Autoriza recibir comunicaciones por correo" al registrar y al editar.
- Estado visible en la ficha: autorizado, no autorizado o sin respuesta.
- Evento en el historial al dar o retirar la autorización, con quién lo registró.

### No incluye

- Firma o documento escaneado de la autorización.
- Autorización por canal (correo, SMS…): solo correo.

## Criterios de aceptación

- [ ] **Dado que** registro un paciente y marco la autorización, **cuando** guardo, **entonces** su ficha dice
      "Autoriza comunicaciones por correo".
- [ ] **Dado que** el paciente fue registrado antes de esta historia, **cuando** abro su ficha, **entonces** dice "Sin
      respuesta" y no recibirá correos.
- [ ] **Dado que** el paciente retira su autorización, **cuando** la desmarco y guardo, **entonces** queda "No
      autoriza" y el historial muestra el retiro con mi nombre.
- [ ] **Dado que** otra persona cambió la ficha mientras yo la editaba, **cuando** guardo la autorización,
      **entonces** se me avisa del conflicto como en cualquier edición.

## Estados de error y vacíos

- "Sin respuesta" es un estado válido y visible, no un error.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Valor por defecto | Sin respuesta (equivale a no autorizar). |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Autorización | Sin autorización no se envía nada; los cambios se trazan. |

## Requisitos de consistencia

La casilla se comporta como los demás campos del registro y la edición del paciente (Épica 2).

## Áreas que cambia

El formulario de registro, la edición y la ficha del paciente; su historial.

## Áreas que no debe cambiar

El resto de los datos del paciente y las citas.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Registrar un paciente con autorización.
2. Abrir un paciente antiguo y comprobar "Sin respuesta".
3. Retirar la autorización y revisar el historial.

## Preguntas abiertas

- ¿Se requiere guardar el texto exacto de la autorización que se le leyó al paciente?
