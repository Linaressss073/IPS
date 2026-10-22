# Historia 2: Pruebas del aislamiento entre IPS y de los permisos

> Como responsable de los datos de una IPS, quiero que el aislamiento entre IPS y los permisos por rol estén
> demostrados por pruebas automáticas para que ningún cambio futuro exponga información de pacientes.

## Estado

Borrador: pendiente de revisión con el usuario.

## Seguridad del despliegue

No requiere *feature flag*: solo agrega pruebas.

## Contexto

El control de acceso decide quién ve qué: verifica la sesión, que la persona pertenezca a la IPS y que su rol tenga
el permiso de cada acción. Hoy se prueba indirectamente desde los e2e de cada módulo, pero no tiene pruebas propias.
Esta historia es técnica a propósito: su resultado observable es una protección, no una pantalla.

## Entregabilidad

Completa: no cambia el comportamiento.

## Alcance

### Incluye

- Pruebas de la verificación de la sesión: token vencido, mal firmado o emitido para un frontend no autorizado.
- Pruebas de la pertenencia a la IPS: IPS activa en el token y consulta al proveedor cuando no lo es.
- Pruebas de la matriz completa de permisos por rol, comparada con la tabla de `technical-api/README.md`.
- Pruebas de acciones que aceptan varios permisos.

### No incluye

- Cambios en la matriz de permisos.
- Auditoría de seguridad externa.

## Criterios de aceptación

- [ ] **Dado que** una sesión está vencida o mal firmada, **cuando** llama a cualquier acción, **entonces** se rechaza
      y hay una prueba que lo demuestra.
- [ ] **Dado que** una persona no pertenece a la IPS, **cuando** intenta cualquier acción de esa IPS, **entonces** se
      rechaza y hay una prueba que lo demuestra.
- [ ] **Dado que** la matriz de permisos documentada dice que "farmacia" no lee notas clínicas, **cuando** corren las
      pruebas, **entonces** una prueba lo verifica; y así para cada rol y permiso de la tabla.
- [ ] **Dado que** alguien cambia por error un permiso de un rol, **cuando** corre la verificación, **entonces** una
      prueba falla indicando el rol y el permiso.
- [ ] **Dado que** la IPS es la organización activa del token, **cuando** se verifica la pertenencia, **entonces** no
      se consulta al proveedor, y hay una prueba que lo demuestra.

## Estados de error y vacíos

No aplica: no hay interfaz.

## Decisiones de diseño

| Decisión | Resolución |
| --- | --- |
| Fuente de verdad | La tabla de permisos documentada; si cambia, la prueba debe cambiar con ella. |

## Decisiones de la épica que aplican

| Decisión | Resolución |
| --- | --- |
| Verificación | Las pruebas corren en cada despliegue de Render (Historia 1). |

## Requisitos de consistencia

Las pruebas siguen el estilo de las unitarias existentes (repositorios en memoria, sin red).

## Áreas que cambia

Solo las pruebas.

## Áreas que no debe cambiar

El comportamiento del control de acceso.

## Definición de terminado

- [ ] Todos los criterios de aceptación se cumplen.
- [ ] Cambiar a propósito un permiso hace fallar al menos una prueba.

## Pasos de verificación

1. Correr las pruebas unitarias y comprobar que pasan.
2. Quitar un permiso de un rol en el código y comprobar el fallo con un mensaje claro.
3. Restaurarlo.
