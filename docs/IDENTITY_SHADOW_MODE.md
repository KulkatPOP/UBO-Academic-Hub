# Validación en modo sombra del Identity Adapter

## Qué es y por qué se usa

El modo sombra ejecuta una observación paralela: toma una identidad UBO ya resuelta, la transforma con el adapter experimental y compara el `IdentitySnapshot` resultante. El resultado no controla acceso, navegación, render, sesión, logout ni autorización. Permite verificar el contrato antes de cualquier migración irreversible.

## Flujo actual y flujo paralelo

```text
Fuente UBO vigente ──> login / sesión / guards UBO ──> comportamiento actual
         │
         └────────────> Identity Adapter experimental ──> IdentitySnapshot
```

El adapter no se importa desde `app.js`, selector demo, dashboards ni route guards. La prueba `tests/core-identity-shadow.test.js` es el único punto de observación de esta fase.

## Perfiles observados

| Perfil | Identidad UBO vigente | Snapshot paralelo |
|---|---|---|
| Student — Sofía | `uboSession` resuelta por la frontera legacy | `{ id: "student-sofia-martinez", roles: ["STUDENT"] }` |
| Teacher — Carlos | demo identity normalizada | `{ id: "teacher-carlos-perez", roles: ["TEACHER"] }` |
| Admin — Administrador UBO | demo identity normalizada | `{ id: "admin-ubo", roles: ["ADMIN"] }` |

Los roles son claims explícitos de UBO demo. No son permisos, no se infieren desde propiedades adicionales y no se convierten a una política de autorización del Core.

## Ausencia, identidad inválida y cambio de perfil

- Una identidad ausente se observa como `null`, nunca `undefined`, `{}` ni un snapshot anterior.
- Una identidad presente con ID vacío/desconocido, rol vacío/desconocido o combinación ID/rol imposible se rechaza explícitamente sin cambiar el flujo UBO.
- La secuencia Sofía → Carlos → Admin → Sofía genera snapshots independientes de un único rol. No conserva roles anteriores ni acumula claims.

## Logout, privilegios, inmutabilidad y determinismo

Los mecanismos actuales de logout permanecen intactos. Tras limpiar la identidad demo o representar una sesión Student cerrada, la observación devuelve `null`; no conserva un snapshot anterior.

Propiedades como `permissions`, `isAdmin` o `roleClaims` se ignoran al generar el snapshot. Un Student no puede convertirse en Admin y un Admin no adquiere Teacher por propiedades extras. Los snapshots y su arreglo `roles` son inmutables. La misma entrada válida produce siempre el mismo `{ id, roles }`.

## Fallo del adapter

La prueba usa un mock que lanza un error durante una observación Teacher. El error queda contenido en la observación: la identidad demo almacenada y la decisión del guard Teacher continúan válidas. Esto demuestra que el adapter no controla el runtime.

## Aislamiento y límites

El adapter recibe datos ya resueltos. No importa UI, route guards, `app.js`, selector demo, almacenamiento, DOM, red, `fetch`, APIs externas ni variables de entorno. UBO consume el contrato de UniEcosystemCore; el Core no depende de UBO.

No se activa `AuthorizationContext`, Permission Policy, `SessionPort`, Career ni Room. `uboSession`, demo identity y la PWA `ubo-academic-hub-v114` no cambian. La seguridad sigue siendo la de los guards frontend UBO; no sustituye autorización de servidor ni autenticación institucional real.

## Rollback y próxima fase

El rollback consiste en retirar la prueba y el adapter experimental sin tocar sesiones, UI o datos. Una fase posterior, solo tras aprobación, podría observar un `SessionPort` efímero detrás de una bandera. Antes de ello se debe diseñar la equivalencia de autorización legacy hacia el Core, sin convertir permisos en roles ni cambiar los guards existentes.
