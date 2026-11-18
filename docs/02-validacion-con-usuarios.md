# Validación con usuarios

[← Índice](README.md)

Protocolo para validar el sistema con las personas que lo usarían en una consulta externa. **El protocolo está listo; los resultados están sin completar** hasta que se realicen las sesiones (las tablas de la sección 6 están vacías a propósito: no se inventan resultados).

## 1. Objetivo

Comprobar que cada rol completa su tarea principal sin ayuda, en un tiempo razonable y con pocos errores, y recoger problemas de comprensión que las pruebas automáticas no ven.

## 2. Preparación

- **Entorno:** la organización de prueba **DEV** en Clerk, con datos **ficticios** (nunca pacientes reales).
- **Cuentas:** una por rol, con los permisos de la matriz del proyecto: administración, agendamiento, admisión, médico, farmacia y la pantalla de sala (TV).
- **Participantes:** 5 personas (mínimo recomendado para detectar la mayoría de los problemas de uso en una prueba cualitativa): idealmente 1 de administración, 1 de agendamiento o admisión, 1 médica o médico, 1 de farmacia y 1 con baja visión o que use teclado/lector de pantalla.
- **Duración:** 30 a 40 minutos por persona. Una persona modera y otra observa y anota; no se ayuda salvo bloqueo de más de 2 minutos (se anota como «ayuda»).
- **Consentimiento:** se explica el propósito, que se evalúa el sistema y no a la persona, que no se recogen datos personales ni se graba sin permiso, y que puede parar cuando quiera. Registro de participación sin nombres (P1…P5).

## 3. Tareas por rol

| # | Rol | Tarea | Éxito si… |
|---|---|---|---|
| T1 | Agendamiento | Registrar un paciente nuevo y agendarle una cita con un médico para mañana | La cita aparece en la agenda del médico |
| T2 | Admisión | Registrar la llegada del paciente con cita de hoy y ver su turno en la sala | El turno aparece en la pantalla de sala |
| T3 | Médico | Llamar al paciente, escribir la consulta (motivo y diagnóstico) y firmarla con una fórmula | La consulta queda firmada y la fórmula existe |
| T4 | Farmacia | Llamar el turno, entregar la fórmula parcialmente y luego el resto | La fórmula queda entregada completa |
| T5 | Administración | Dar el rol «Médico» a una persona del personal y abrir la agenda de ese médico | La persona puede usar las funciones médicas |
| T6 | Todos | Corregir un error a propósito (por ejemplo, documento repetido) y entender qué pasó | Dice con sus palabras qué falló y cómo arreglarlo |
| T7 | TV de sala | Con un turno llamado, identificar cuándo es su turno sin que nadie le diga | Lo identifica en menos de 10 s |

## 4. Medidas

| Medida | Cómo se registra | Meta sugerida |
|---|---|---|
| Éxito de la tarea | Completa sin ayuda / con ayuda / no completa | ≥ 80 % sin ayuda |
| Tiempo por tarea | Cronómetro, desde la consigna hasta el éxito | Registrar mediana; sin meta rígida |
| Errores | Clics o pasos equivocados; mensajes de error que aparecen | Registrar; revisar los más repetidos |
| Satisfacción | Cuestionario SUS (sección 5) | ≥ 68 puntos (promedio de referencia) |
| Comentarios | Frases textuales de la persona | Agrupar por pantalla |

## 5. Cuestionario SUS (System Usability Scale)

Cada afirmación se responde de 1 (muy en desacuerdo) a 5 (muy de acuerdo):

1. Creo que me gustaría usar este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría ayuda de una persona con conocimientos técnicos para usarlo.
5. Encontré que las funciones del sistema estaban bien integradas.
6. Pensé que había demasiada inconsistencia en el sistema.
7. Imagino que la mayoría de las personas aprenderían a usarlo muy rápido.
8. Encontré el sistema muy incómodo de usar.
9. Me sentí muy seguro/a usando el sistema.
10. Necesité aprender muchas cosas antes de poder usarlo.

**Puntaje:** en los ítems impares se resta 1 a la respuesta; en los pares se calcula 5 menos la respuesta; se suman los 10 valores y se multiplica por 2,5 (rango 0 a 100).

## 6. Registro de resultados (completar tras las sesiones)

**Fecha de las sesiones:** ____________  **Moderador:** ____________  **Observador:** ____________

| Participante | Rol | T1 | T2 | T3 | T4 | T5 | T6 | T7 | SUS |
|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | |
| P2 | | | | | | | | | |
| P3 | | | | | | | | | |
| P4 | | | | | | | | | |
| P5 | | | | | | | | | |

Marcar cada tarea: **S** (sin ayuda), **A** (con ayuda), **N** (no completó), y el tiempo en segundos.

### Problemas encontrados

| # | Pantalla | Qué ocurrió | Gravedad (alta/media/baja) | Quién lo vio | Acción → historia en Jira |
|---|---|---|---|---|---|
| 1 | | | | | |

## 7. Cómo se usan los resultados

1. Cada problema de gravedad alta o media se convierte en una historia en Jira (épica de QA, IPS-142) con criterios Dado/Cuando/Entonces.
2. Se corrige, se repite la tarea con la misma persona o una nueva y se anota la mejora.
3. El promedio de SUS, el éxito por tarea y los problemas corregidos se anexan al informe como evidencia de validación.

## 8. Límites

Cinco personas detectan los problemas de uso más frecuentes, pero no permiten conclusiones estadísticas. Las sesiones con datos ficticios no reemplazan una validación clínica en una IPS real.
