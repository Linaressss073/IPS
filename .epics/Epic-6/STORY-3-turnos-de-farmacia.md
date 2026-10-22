# Historia 3: Turnos de farmacia en la pantalla de sala

> Como farmacéutico, quiero darle un turno al paciente que llega con su fórmula para llamarlo a mi ventanilla por la
> misma pantalla de la sala.

## Estado

Implementada.

## Seguridad del despliegue

No requiere *feature flag*: reutiliza la pantalla de sala existente.

## Contexto

Tras la consulta, el paciente hace fila en la farmacia. Esta historia le da un turno FAR n en una ventanilla y lo
integra con los turnos y la pantalla de sala de la admisión.

## Entregabilidad

Completa.

## Alcance

### Incluye

- Dar turno FAR n a una fórmula en una ventanilla activa (una ubicación como "Farmacia 1").
- Llamarlo, atenderlo o cerrarlo desde Turnos, como cualquier turno.
- Mostrarlo en la pantalla de sala.

### No incluye

- Turno de farmacia sin fórmula del sistema.

## Criterios de aceptación

- [ ] **Dado que** la fórmula tiene pendientes y existe la ventanilla "Farmacia 1", **cuando** le doy turno,
      **entonces** recibe "FAR 1" (o el siguiente del día).
- [ ] **Dado que** la fórmula ya tiene turno hoy, **cuando** le doy otro, **entonces** el sistema no lo permite.
- [ ] **Dado que** la fórmula está completa, **cuando** intento darle turno, **entonces** se rechaza.
- [ ] **Dado que** la ventanilla no existe o está inactiva, **cuando** la elijo, **entonces** se rechaza.
- [ ] **Dado que** llamo FAR 1, **cuando** miro la pantalla de sala, **entonces** veo "FAR 1 · Farmacia 1" con el
      nombre corto del paciente.

## Estados de error y vacíos

- Sin ventanillas activas: aviso para que el administrador cree una ubicación de farmacia.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Ventanilla | Cualquier ubicación activa de la IPS. |
| Origen | El turno indica que viene de farmacia y de qué consulta. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Turnos | FAR n por día, en la pantalla de sala. |

## Requisitos de consistencia

El turno FAR se comporta igual que los turnos de cita (Épica 4): mismos estados, llamados y pantalla.

## Áreas que cambia

El detalle de la fórmula (dar turno), la lista de turnos y la pantalla de sala.

## Áreas que no debe cambiar

Los turnos de cita.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Los flujos que ya funcionaban siguen funcionando.

## Pasos de verificación

1. Crear la ubicación "Farmacia 1".
2. Dar turno a una fórmula pendiente.
3. Llamarlo desde Turnos y verlo en la pantalla de sala.

## Evidencia

Commit `a00150c`. Pruebas: `api/test/pharmacy.e2e-spec.ts`.
