# Historia 2: Ficha de la IPS

> Como administrador de una IPS, quiero registrar y mantener los datos legales y de contacto de mi institución para
> que el sistema la identifique correctamente ante pacientes y entidades.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: la pantalla de configuración solo la usa el administrador.

## Contexto

Al crear una IPS solo se conoce su nombre. Una IPS en Colombia se identifica por su NIT y su código de habilitación
del REPS, y necesita dirección, municipio, departamento, teléfono y correo institucional. Esta historia da al
administrador una ficha para mantener esos datos y la opción de eliminar la IPS sin perder la información clínica.

## Entregabilidad

Completa: la ficha se puede ver, editar y eliminar sin afectar otros flujos.

## Alcance

### Incluye

- Ver la ficha (cualquier miembro).
- Editar nombre, NIT con dígito de verificación, código REPS, dirección, municipio, departamento, teléfono y correo
  (solo administrador). El nombre también cambia en el inicio de sesión.
- Aviso si otra persona guardó cambios mientras se editaba.
- Eliminar la IPS (solo administrador) conservando pacientes e historial.

### No incluye

- Sedes múltiples de una misma IPS.
- Logo o imagen institucional.
- Validación del código REPS contra el registro oficial del Ministerio.

## Criterios de aceptación

- [ ] **Dado que** soy miembro de la IPS, **cuando** abro su configuración, **entonces** veo su nombre, NIT, código
      REPS y datos de contacto.
- [ ] **Dado que** soy administrador, **cuando** guardo el NIT `890903938-8`, **entonces** se acepta porque el dígito
      de verificación es correcto.
- [ ] **Dado que** soy administrador, **cuando** guardo un NIT con un dígito de verificación que no corresponde,
      **entonces** el sistema lo rechaza indicando que el NIT no es válido.
- [ ] **Dado que** soy administrador, **cuando** guardo un código REPS que no tiene entre 10 y 12 dígitos,
      **entonces** el sistema lo rechaza.
- [ ] **Dado que** soy administrador y cambio el nombre de la IPS, **cuando** guardo, **entonces** el nuevo nombre
      aparece también al iniciar sesión y al cambiar de IPS.
- [ ] **Dado que** otra persona guardó la ficha mientras yo la editaba, **cuando** guardo, **entonces** el sistema me
      avisa del conflicto y no pisa su cambio.
- [ ] **Dado que** no soy administrador, **cuando** intento editar o eliminar la IPS, **entonces** el sistema me lo
      impide.
- [ ] **Dado que** soy administrador, **cuando** elimino la IPS, **entonces** deja de aparecer para todos sus miembros
      y sus pacientes e historial se conservan.

## Estados de error y vacíos

- Campos opcionales sin dato: se muestran vacíos y se pueden borrar.
- Guardar sin cambios: no hace nada ni cambia la versión.
- Error de validación: mensaje junto al campo, sin perder lo escrito.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| NIT | Base de 6 a 10 dígitos + dígito de verificación DIAN; se aceptan puntos. |
| Código REPS | 10 a 12 dígitos. |
| Ficha inexistente | Si la IPS existe en Clerk pero aún no tiene ficha, se crea al consultarla. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Administrador | Solo el rol `admin` de Clerk edita o elimina. |
| Eliminar una IPS | Deja una lápida; nunca borra pacientes ni historial. |

## Requisitos de consistencia

La configuración debe sentirse parte del mismo tablero de la Historia 1: mismo encabezado, menú y estilo.

## Áreas que cambia

La página de configuración de la IPS.

## Áreas que no debe cambiar

El directorio y los roles del personal (Historias 3 y 4).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] No hay errores nuevos en la consola del navegador.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Como administrador, abrir la configuración y llenar NIT, REPS y contacto; guardar.
2. Cambiar el último dígito del NIT y comprobar el rechazo.
3. Abrir la ficha en dos pestañas, guardar en una y luego en la otra: comprobar el aviso de conflicto.
4. Cambiar el nombre de la IPS y comprobarlo en el selector de IPS.
5. Con una cuenta sin rol de administrador, comprobar que no puede editar.

## Evidencia

Commits `378cca1`, `8f10e9c`. Pruebas: `api/test/organizations.e2e-spec.ts` y el unitario de la entidad.
