# ADR: BFF en Next.js que genera la fórmula médica en PDF con pdf-lib

## Status

Accepted

## Date

2026-11-04

## Context

- La IPS necesita entregar al paciente la fórmula médica firmada como PDF, con el formato de una fórmula colombiana (ejemplo de EPS Sanitas) y los datos de cada IPS, sin nombres fijos.
- Faltaban datos derivados: número de fórmula, vigencia (30 días), edad y cantidad en letras. La API no los guarda y no se quiso agregar campos nuevos.
- El API corre en el plan gratuito de Render (duerme y arranca lento) y el frontend en un servidor Next.js propio.

## Options Considered

### Option 1: PDF en la API

- **Description**: Un endpoint de la API devuelve el PDF ya armado.
- **Pros**: Un solo lugar con toda la lógica.
- **Cons**: Mezcla presentación con el dominio; carga el servicio gratuito.

### Option 2: `@react-pdf/renderer`

- **Description**: Describir el PDF con componentes React.
- **Pros**: Maquetación declarativa.
- **Cons**: Dependencia grande y delicada con React 19 y el empaquetado de Next.

### Option 3: `pdfkit`

- **Description**: Librería de Node para PDF.
- **Pros**: Madura.
- **Cons**: Lee archivos de fuentes del disco, que el empaquetado de Next suele romper.

### Option 4: BFF con `pdf-lib`

- **Description**: La API entrega los datos (`GET /consultations/:id/formula`); un route handler de Next.js bajo `/dashboard/:id/consultations/:id/formula` los pide con el token de la sesión y arma el PDF con `pdf-lib`.
- **Pros**: JavaScript puro, fuentes estándar incluidas, sin problemas de empaquetado; la lógica de presentación queda en el frontend; la API solo expone datos.
- **Cons**: Maquetación manual con coordenadas; el servidor del frontend hace el trabajo.

## Decision

Opción 4. Los campos derivados (número, vigencia, edad, cantidad en letras) se calculan en el BFF a partir de los datos que ya existen, en hora de Bogotá. La ruta vive bajo `/dashboard/:id/…` para que el middleware de Clerk la proteja y el token lleve la IPS activa.

## Consequences

### Benefits

- Sin cambios de esquema ni de datos para obtener el PDF.
- Cada IPS imprime con sus propios datos; las líneas vacías no se imprimen.
- Cubierto por pruebas unitarias (`lib/formula`) y por la prueba e2e del endpoint de datos.

### Trade-offs and Limitations

- El registro profesional y la especialidad del médico no se imprimen: el sistema no los guarda todavía.
- El número de fórmula se deriva del id de la consulta; no es un consecutivo por IPS.
- La ruta usa el token de Clerk en el servidor y falta probarla con una sesión real en la web desplegada.

## Adoption Impact

- `adoption/tech/tech-stack.md`: agregar `pdf-lib` y `vitest` (frontend).
- `adoption/tech/architecture.md`: registrar el BFF de la fórmula y su ubicación.
