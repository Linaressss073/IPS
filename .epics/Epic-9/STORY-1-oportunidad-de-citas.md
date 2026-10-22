# Historia 1: Oportunidad en la asignación de citas

> Como administrador o administrador médico de la IPS, quiero saber cuántos días esperan en promedio los pacientes
> por una cita en cada servicio para detectar dónde falta oferta.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

No requiere *feature flag*: pantalla nueva de solo lectura y un rol nuevo que nadie tiene hasta que se asigna.

## Contexto

La oportunidad en la asignación de citas es un indicador de calidad que las IPS reportan. El sistema ya sabe cuándo
se agendó cada cita y para qué fecha. Esta historia crea el rol "Administrador médico" (personal asistencial que
coordina la atención) y el permiso de indicadores, y muestra el promedio de días de espera por servicio y mes.

## Entregabilidad

Completa: el administrador ve el indicador desde el despliegue; el administrador médico, en cuanto se le asigna el rol.

## Alcance

### Incluye

- Rol funcional nuevo "Administrador médico", asignable desde "Personal".
- Permiso de indicadores para el administrador y el administrador médico, y su sección en el menú.
- Indicador por mes y servicio: promedio de días entre el agendamiento y la fecha de la cita.
- Número de citas incluidas en el cálculo y comparación con el mes anterior.
- Actualizar la matriz de permisos documentada.

### No incluye

- Otros permisos para el administrador médico (historia clínica, agenda…).
- Exportar el indicador.
- Metas o semáforos configurables.

## Criterios de aceptación

- [ ] **Dado que** soy administrador, **cuando** asigno a una persona el rol "Administrador médico", **entonces** queda
      en su lista de roles y el cambio se registra como cualquier asignación.
- [ ] **Dado que** tengo el rol "Administrador médico", **cuando** entro al tablero, **entonces** veo la sección
      Indicadores, pero no Consultas, Agenda, Admisión ni Farmacia.
- [ ] **Dado que** tengo solo el rol "médico" o "admisión", **cuando** intento abrir Indicadores, **entonces** se me
      niega.
- [ ] **Dado que** en octubre se agendaron en Medicina general dos citas, una para 2 días después y otra para 4 días
      después, **cuando** veo el indicador de octubre, **entonces** muestra 3 días con 2 citas.
- [ ] **Dado que** una cita fue cancelada, **cuando** se calcula el indicador, **entonces** no se incluye.
- [ ] **Dado que** una cita fue reprogramada, **cuando** se calcula, **entonces** se usa la fecha final de la cita y la
      fecha del agendamiento original.
- [ ] **Dado que** filtro por un servicio, **cuando** veo el indicador, **entonces** muestra solo ese servicio.
- [ ] **Dado que** un mes no tiene citas, **cuando** lo consulto, **entonces** dice "Sin datos" en lugar de 0.

## Estados de error y vacíos

- Sin datos: "Sin citas en este periodo".
- Cargando: indicador de carga en cada cifra.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Reprogramadas | Fecha original de agendamiento y fecha final de la cita (propuesta). |
| Nombre del rol | "Administrador médico" en pantalla. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Quién los ve | Administrador y Administrador médico (`indicators:read`). |
| Periodo | Mes en hora de Colombia, filtro por servicio. |
| Datos clínicos | Solo cifras agregadas. |

## Áreas que cambia

Una sección nueva de indicadores en el tablero, la lista de roles de "Personal" y la matriz de permisos.

## Áreas que no debe cambiar

Los permisos de los roles existentes y el agendamiento.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] El cálculo está cubierto por pruebas con casos de reprogramación y cancelación.
- [ ] La matriz de permisos documentada incluye el rol y el permiso nuevos.

## Pasos de verificación

1. Asignar a una persona el rol "Administrador médico" y entrar con ella: comprobar el menú.
2. Agendar varias citas con distintas distancias en días; cancelar una y reprogramar otra.
3. Comprobar el promedio y el conteo del mes.
4. Entrar con un médico y comprobar que no ve Indicadores.

## Preguntas abiertas

- ¿Se mide desde el agendamiento o desde una fecha deseada por el paciente?
- ¿El Administrador médico necesita algún otro permiso?
