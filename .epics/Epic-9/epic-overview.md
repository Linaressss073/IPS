# Épica 9: Indicadores de la consulta externa

## Objetivo

Convertir lo que el sistema ya registra (citas, turnos, consultas y dispensaciones) en indicadores que la dirección de
la IPS pueda consultar sin pedir informes a mano: oportunidad en la asignación de citas, inasistencia, tiempos de
espera en sala y cumplimiento de la dispensación. Todos los datos ya existen; esta épica solo los agrega y los
muestra.

**Estado:** propuesta, pendiente de aprobación.

## Documentos de referencia

- `technical-api/06-scheduling.md`, `07-admission.md`, `09-pharmacy.md` (datos de origen).
- Resolución 256 de 2016 del Ministerio de Salud (indicadores de calidad), entre ellos la oportunidad en la
  asignación de cita en la consulta externa. Verificar la definición exacta de cada indicador antes de implementarlo.

## Decisiones de diseño resueltas

| Decisión | Resolución |
| --- | --- |
| Quién los ve | El **administrador** y un rol funcional nuevo, **Administrador médico** (personal asistencial que coordina la atención), con un permiso nuevo `indicators:read` (decisión del usuario, 21-oct-2026). |
| Administrador médico | Rol asignable desde "Personal" como los demás. Por ahora solo da `indicators:read`: no lee notas clínicas ni opera agenda, admisión o farmacia, salvo que se decida otra cosa. |
| Datos clínicos | Ningún indicador muestra pacientes individuales ni diagnósticos: solo cifras agregadas. |
| Periodo | Mes calendario en hora de Colombia, con filtro por servicio. |
| Cálculo | A partir de los datos existentes, sin cambiar cómo se registran. |

## Orden de las historias

### Historia 1: Oportunidad en la asignación de citas

**Prioridad**: es el indicador de calidad más conocido de la consulta externa.
Promedio de días entre el momento en que se agendó la cita y la fecha de la cita, por servicio y mes. Incluye el rol
"Administrador médico" y el permiso de indicadores, para que la primera pantalla ya la vean las personas correctas.
**Dependencias**: Épica 3.

### Historia 2: Inasistencia y tiempos de espera en sala

**Prioridad**: mide el efecto de los recordatorios (Épica 8) y el flujo de la sala.
Porcentaje de turnos "no se presentó" y tiempo promedio entre la llegada y el primer llamado, por servicio y mes.
**Dependencias**: Épica 4.

### Historia 3: Cumplimiento de la dispensación e inventario

**Prioridad**: muestra si la farmacia entrega completo y qué se está agotando o venciendo.
Porcentaje de fórmulas entregadas completas en la primera entrega, fórmulas con pendientes y productos con alertas.
**Dependencias**: Épica 6.

## Contexto compartido para el detalle de historias

- **Datos:** colecciones `scheduling_appointments`, `admission_turns`, `pharmacy_dispensations`,
  `pharmacy_products`; `trace_events` para fechas de cada paso.
- **Patrón de consultas:** `application/queries/` de cada contexto (CQRS: las consultas leen directo, sin dominio).
- **Hora de Colombia:** `api/src/shared/domain/utils/colombia-time.ts`.
- **Frontend:** tablero en `app/dashboard/[teamId]/(overview)`, permisos en `components/access/access-context.tsx`,
  asignación de roles en `app/dashboard/[teamId]/staff`.
- **Roles y permisos:** `api/src/contexts/staff/` (roles válidos, `assign-staff-roles.command.ts`),
  `api/src/contexts/identity-access/` (permisos por rol), matriz en `technical-api/README.md` y `03-staff.md`.

## Preguntas abiertas

1. ¿El Administrador médico debe tener más permisos además de los indicadores (por ejemplo, leer historias clínicas
   para auditoría o ver la agenda)?
2. ¿La oportunidad se mide desde que se agenda o desde una "fecha deseada" que diga el paciente? Hoy el sistema no
   guarda fecha deseada.
3. ¿Se necesita exportar los indicadores (Excel o CSV) para reportes a la Superintendencia o la EPS?
