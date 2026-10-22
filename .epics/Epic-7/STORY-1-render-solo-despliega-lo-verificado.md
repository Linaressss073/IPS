# Historia 1: Render solo despliega lo que pasa la verificación

> Como integrante del equipo de desarrollo, quiero que Render se niegue a desplegar un cambio que rompe las pruebas
> para que ningún error conocido llegue a producción.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

No requiere *feature flag*: no cambia el comportamiento de la aplicación, solo cuándo se despliega.

## Contexto

Render despliega automáticamente cada cambio en `main`, pero solo instala y compila: si una prueba falla, el cambio
llega igual a producción. Esta historia hace que el *build* de la API corra lint y las pruebas unitarias antes de
compilar, para que un fallo detenga el despliegue y producción siga con la versión anterior. Las pruebas e2e, que
necesitan MongoDB, siguen corriéndose en local antes de subir.

## Entregabilidad

Completa: el flujo de despliegue es el mismo, con un paso de verificación más.

## Alcance

### Incluye

- API: lint y pruebas unitarias en el *build* de Render, antes de la compilación.
- Frontend: se mantiene `next build`, que ya compila y revisa tipos.
- Un comando local único que corre todo, e2e incluidos, para usar antes de subir.
- Documentación de cómo leer en Render un despliegue fallido por pruebas.

### No incluye

- Pruebas e2e en Render.
- Verificación de pull requests antes de fusionar (Render despliega `main`).
- Medición de cobertura con umbral mínimo.

## Criterios de aceptación

- [ ] **Dado que** subo a `main` un cambio que rompe una prueba unitaria, **cuando** Render lo construye,
      **entonces** el despliegue falla, el log muestra la prueba que falló y producción sigue con la versión anterior.
- [ ] **Dado que** subo un cambio con un error de lint, **cuando** Render lo construye, **entonces** el despliegue
      falla y el log muestra el error.
- [ ] **Dado que** el frontend no compila, **cuando** Render construye `ips-web`, **entonces** el despliegue falla y la
      versión anterior sigue en línea.
- [ ] **Dado que** todo pasa, **cuando** Render construye, **entonces** despliega como hoy y el *build* no tarda más de
      2 minutos adicionales.
- [ ] **Dado que** voy a subir un cambio, **cuando** corro el comando local de verificación, **entonces** corre lint,
      unitarias, compilación y e2e, y me dice si puedo subir.

## Estados de error y vacíos

- Fallo de verificación: Render marca el despliegue como fallido y el servicio sigue sirviendo la versión anterior.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Orden en el *build* | Instalar → lint → pruebas unitarias → compilar: lo más rápido de fallar va primero. |
| Secretos | Ninguno nuevo: las pruebas unitarias no usan red ni base de datos. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Plataforma | Render, en el *build* de cada servicio. |
| E2E | Locales antes de subir. |
| `render.yaml` | Solo cambian los comandos de *build*. |

## Áreas que cambia

El comando de *build* de `ips-api` en `render.yaml`, los scripts de la API y el README.

## Áreas que no debe cambiar

La aplicación y los demás campos de `render.yaml` (servicios, variables, plan, región).

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] El README explica qué verifica Render y cómo correr la verificación completa en local.

## Pasos de verificación

1. Subir un cambio inocuo y comprobar que Render despliega.
2. Subir en una rama de prueba un cambio que rompa una prueba, fusionarlo y comprobar en Render el despliegue fallido
   y que producción no cambió.
3. Revertir el cambio y comprobar que Render vuelve a desplegar.
4. Correr el comando local de verificación con Docker encendido.
