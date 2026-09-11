# Diseño de observación de SessionPort

## Objetivo

Esta fase prepara una observación reversible entre la identidad UBO ya resuelta, el Identity Adapter experimental y el `SessionPort` de referencia de UniEcosystemCore. No migra sesiones: el puerto se usa únicamente en pruebas con `InMemorySession`, sin persistencia ni consumidores runtime.

## Flujo actual y futuro

Actualmente Student utiliza `uboSession`; Teacher y Admin utilizan demo identity y los guards UBO. Esos mecanismos mantienen la sesión y el acceso vigente.

```text
Flujo vigente: fuente UBO → sesión / guards UBO → runtime
Flujo observado: fuente UBO → Identity Adapter → IdentitySnapshot → InMemorySession
```

El futuro posible es conservar la misma entrada ya resuelta y, tras aprobación explícita, alimentar un `SessionPort` detrás de una activación reversible. Nunca se propone conectar almacenamiento UBO directamente al Core.

## Bandera

`config/institution.js` es el único propietario de `featureFlags.USE_CORE_SESSION`. Su valor actual y obligatorio es `false`.

La bandera es booleana, estática, fail-safe y no se lee desde almacenamiento. No tiene consumidores en el runtime ni convierte el Core en un asset PWA dinámico. Su futura eliminación será posible cuando la migración de sesión esté aprobada. No se permite dejar `true` como estado persistente durante esta fase.

## Perfiles, ausencia y cambio

| Perfil | Fuente UBO | Identidad observada |
|---|---|---|
| Sofía / Student | `uboSession` ya resuelta | `student-sofia-martinez` / `STUDENT` |
| Carlos / Teacher | demo identity ya resuelta | `teacher-carlos-perez` / `TEACHER` |
| Administrador / Admin | demo identity ya resuelta | `admin-ubo` / `ADMIN` |

Ausencia de sesión produce `null` tanto para el snapshot como para el puerto observado. La secuencia Sofía → Carlos → Admin → Sofía reemplaza la identidad completa en cada paso, sin mezclar roles.

## Logout, errores y privilegios

Después de logout, la observación limpia exclusivamente el `InMemorySession` de la prueba; no opera sobre `uboSession` ni demo identity. Las entradas inválidas se rechazan y no originan una identidad observada.

Un fallo del adapter se contiene en la observación. No puede cerrar ni abrir la sesión UBO, alterar su rol, bloquear rutas ni modificar navegación. Campos adicionales como `permissions` e `isAdmin` no forman parte del snapshot y no escalan privilegios.

## Inmutabilidad y determinismo

El `IdentitySnapshot` y la identidad recuperada del `InMemorySession` son inmutables. La misma identidad resuelta genera el mismo snapshot; los snapshots no cambian después de ser creados ni afectan el objeto de entrada.

## Rollback, límites y siguiente fase

El rollback consiste en retirar la prueba y esta documentación, o mantener la bandera en `false`; no requiere cambios de datos, UI, logout, rutas ni PWA. No hay autenticación real, autorización Core, backend, red, tokens, cookies ni persistencia.

Antes de una activación controlada se debe definir una política explícita para convivir con las sesiones legacy y modelar rollback operativo. La siguiente fase recomendada es diseñar esa matriz de coexistencia y criterios de aprobación, sin habilitar todavía `USE_CORE_SESSION`.
