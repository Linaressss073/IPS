# Historia 1: Registrar paciente

> Como auxiliar de admisión o agendamiento, quiero registrar a un paciente una sola vez para que ninguna otra área
> vuelva a pedirle sus datos.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: agrega una pantalla nueva.

## Contexto

Hoy cada área de la consulta externa pedía los mismos datos al paciente. Esta historia crea el registro único por IPS
con los datos que exige la atención en Colombia (documento, nombres, nacimiento, sexo, contacto y afiliación) y
deja el primer evento en su historial.

## Entregabilidad

Completa: se puede registrar un paciente y verlo de inmediato.

## Alcance

### Incluye

- Formulario con documento (tipo y número), dos nombres, dos apellidos, fecha de nacimiento, sexo, correo, teléfono,
  dirección, régimen y EPS.
- Acompañante inicial opcional (queda como #1).
- Registrar a nombre de otra persona del personal ("pedido por").
- Rechazo de documentos repetidos en la IPS.

### No incluye

- Verificación de derechos contra la base de la EPS o ADRES.
- Fotografía o huella del paciente.

## Criterios de aceptación

- [ ] **Dado que** el documento CC 1.000.123.456 no está registrado, **cuando** registro al paciente con todos los
      datos obligatorios, **entonces** queda creado con el número guardado como `1000123456` y llego a su ficha.
- [ ] **Dado que** ya existe un paciente con CC 1000123456 en mi IPS, **cuando** intento registrarlo de nuevo,
      **entonces** el sistema me avisa que el documento ya está registrado.
- [ ] **Dado que** el mismo documento existe en otra IPS, **cuando** lo registro en la mía, **entonces** se acepta.
- [ ] **Dado que** elijo régimen "particular", **cuando** escribo una EPS, **entonces** el sistema la rechaza; y con
      cualquier otro régimen, **cuando** la dejo vacía, **entonces** me la exige.
- [ ] **Dado que** escribo una fecha de nacimiento futura o de hace más de 130 años, **cuando** guardo,
      **entonces** el sistema la rechaza.
- [ ] **Dado que** el tipo es CC, TI, RC, NIT o CN, **cuando** el número tiene letras, **entonces** se rechaza.
- [ ] **Dado que** registro a nombre de otra persona del personal, **cuando** guardo, **entonces** el historial
      muestra que ella lo pidió y que yo lo ejecuté.

## Estados de error y vacíos

- Cada error de validación se muestra junto a su campo, sin perder lo escrito.
- Documento repetido: mensaje con opción de buscar al paciente existente.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Correo | Obligatorio; se guarda en minúsculas. |
| Teléfono | Opcional, 7 a 15 dígitos, se ignoran espacios, guiones y paréntesis. |
| Sexo | H, M o I (indeterminado). |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Unicidad | Tipo + número único en la IPS. |
| Afiliación | Particular sin EPS; los demás con EPS. |
| Trazabilidad | `requestedBy` / `executedBy` en la misma transacción. |

## Áreas que cambia

El formulario "Nuevo paciente" y la lista de pacientes.

## Áreas que no debe cambiar

La edición de datos (Historia 3) y los acompañantes adicionales (Historia 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Dos registros simultáneos del mismo documento producen un solo paciente.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Registrar un paciente con CC escrita con puntos y comprobar que se guarda sin ellos.
2. Repetir el registro y comprobar el aviso de documento existente.
3. Probar régimen particular con EPS y contributivo sin EPS.
4. Registrar a nombre de otra persona y revisar el historial.

## Evidencia

Commit `0868629`. Pruebas: `api/test/patients.e2e-spec.ts`, unitarios de `patient.entity`.
