# Historia 2: Buscar y consultar pacientes

> Como integrante del personal, quiero encontrar a un paciente por su documento o nombre para atenderlo sin
> registrarlo de nuevo.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: solo lectura.

## Contexto

Antes de registrar o agendar hay que saber si el paciente ya existe. Los nombres colombianos llevan tildes que no
siempre se escriben al buscar. Esta historia entrega una búsqueda tolerante y la ficha completa del paciente.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Búsqueda por número de documento o por nombres y apellidos, sin importar tildes ni mayúsculas.
- Resultados paginados con el total.
- Ficha del paciente con todos sus datos.

### No incluye

- Búsqueda por teléfono o correo.
- Fusión de pacientes duplicados.

## Criterios de aceptación

- [ ] **Dado que** existe "Andrés Gómez", **cuando** busco "andres gomez", **entonces** aparece en los resultados.
- [ ] **Dado que** existe el documento 1000123456, **cuando** busco "1.000.123.456", **entonces** aparece.
- [ ] **Dado que** hay más de 20 coincidencias, **cuando** busco, **entonces** veo la primera página, el total y puedo
      pasar a la siguiente.
- [ ] **Dado que** abro un paciente de la lista, **cuando** carga su ficha, **entonces** veo documento, nombres,
      nacimiento, sexo, contacto y afiliación.
- [ ] **Dado que** el paciente pertenece a otra IPS, **cuando** abro su dirección directamente, **entonces** el
      sistema indica que no existe.
- [ ] **Dado que** no tengo un rol que lea pacientes, **cuando** abro la lista, **entonces** se me niega.

## Estados de error y vacíos

- Sin resultados: "No hay pacientes que coincidan" con acceso a "Nuevo paciente".
- Cargando: indicador en la lista.
- Paciente inexistente: mensaje y regreso a la lista.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Tamaño de página | 20 por defecto, máximo 100. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Búsqueda | Documento o nombres, sin tildes ni mayúsculas. |

## Requisitos de consistencia

La lista y la ficha usan el mismo estilo del formulario de la Historia 1.

## Áreas que cambia

La lista de pacientes y la ficha del paciente.

## Áreas que no debe cambiar

El formulario de registro (Historia 1).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Buscar un paciente sin tildes y en minúsculas.
2. Buscar por documento con puntos.
3. Paginar una búsqueda amplia.
4. Abrir la ficha y revisar los datos.

## Evidencia

Commit `0868629`. Pruebas: `api/test/patients.e2e-spec.ts`.
