# Hardening de sesión demo y guards de ruta

## Arquitectura y fuente de identidad

La sesión demo UBO usa una identidad mínima normalizada: `{ id, role }`. La única fuente válida de IDs y roles es `data/users.js`:

- `student-sofia-martinez` / `STUDENT`
- `teacher-carlos-perez` / `TEACHER`
- `admin-ubo` / `ADMIN`

`normalizeDemoIdentity()` requiere que ID y rol coincidan como pareja exacta con esa fuente. Roles vacíos, IDs desconocidos, combinaciones imposibles y campos incompletos se rechazan. Los campos adicionales se ignoran; no pueden elevar privilegios.

## Sesión, sessionStorage y core/session.js

`core/demo-identity-session.js` conserva la frontera creada en Fase 1.47. La selección explícita del entorno demo se almacena durante la sesión de la pestaña en `sessionStorage` bajo `uboDemoIdentityV1` y contiene exactamente `{ id, role }`.

No contiene contraseña, token, API key, secreto ni datos académicos. `core/session.js` continúa como cache en memoria, siempre hidratado por la frontera y limpiado cuando una selección es inválida o se cierra.

Un valor presente pero corrupto en `sessionStorage` tiene prioridad de denegación: se limpia la memoria y no se reutiliza una identidad anterior ni se infiere un rol por defecto. Esta decisión evita que un valor manipulado pueda caer accidentalmente en un ADMIN/TEACHER anterior.

## Relación con uboSession

`uboSession` sigue siendo la sesión legacy exclusiva de la aplicación estudiante. En ausencia de una selección demo explícita, la frontera puede derivar en modo lectura a Sofía como `STUDENT` desde una sesión legacy válida cuyo correo coincida con la fuente demo.

La prioridad es explícita:

1. Selección demo válida de la pestaña para los shells demo aislados.
2. Cache demo en memoria validado.
3. Adaptación read-only de `uboSession` para estudiante.
4. Denegación.

Esto mantiene el login estudiante sin cambios y evita que `uboSession` de Sofía reemplace una selección válida de Carlos/Admin. La coexistencia es una compatibilidad temporal: una futura fase deberá definir el cierre de sesión coordinado antes de migrar a una sesión institucional única.

## Cambio de perfil, limpieza y recarga

Cada `setCurrentDemoIdentity()` reemplaza por completo el valor almacenado y el cache, dejando solo ID y rol del perfil nuevo. Un intento de selección inválida limpia la identidad demo actual y devuelve `null`.

`clearCurrentDemoIdentity()` elimina la clave de `sessionStorage` y limpia `core/session.js`. Después, Profesor/Admin se deniegan hasta que exista una identidad demo válida; si hay una sesión legacy de Sofía, solo se resuelve como `STUDENT` y sigue siendo rechazada por los guards Profesor/Admin.

`sessionStorage` sobrevive a una recarga en la misma pestaña, que es coherente con la selección demo durante esa sesión. Una nueva pestaña normalmente no comparte ese almacenamiento; una pestaña duplicada puede heredar el estado según el navegador. Ambas son limitaciones conocidas de una demo frontend.

## Guards y acceso directo

`evaluateDemoRouteGuard()` valida primero la identidad completa y recién después compara el rol requerido. `enforceDemoRouteGuard()` se invoca antes de renderizar los dashboards:

| Identidad | Profesor | Admin |
|---|---:|---:|
| STUDENT | DENY → Student | DENY → Student |
| TEACHER | ALLOW | DENY → Profesor |
| ADMIN | DENY → Admin | ALLOW |
| Nula, corrupta o desconocida | DENY → Selector Demo | DENY → Selector Demo |

El acceso directo a las URLs actuales de Profesor/Admin atraviesa el guard antes del render. No se detectó `PROTECTED_CONTENT_FLASH` en la ruta de renderización: los renderizadores se ejecutan solo cuando `allowed` es verdadero.

## Casos inválidos y no escalamiento

La prueba de hardening cubre valores `null`, `undefined`, objetos vacíos, arreglos, strings, rol sin ID, ID sin rol, ID desconocido e incompatibilidades de ID/rol. También comprueba:

- cambiar solo el rol o solo el ID no eleva privilegios;
- `permissions`, `isAdmin`, `isTeacher`, `isStudent` y campos extra se descartan;
- el orden de propiedades no altera la decisión;
- cambios Sofía → Carlos → Admin → Sofía no conservan campos residuales;
- Carlos → limpiar → Admin y Admin → limpiar → Sofía no consultan la identidad anterior.

## PWA, Career, Room y Core

No se añadieron módulos al grafo ESM en esta fase, por lo que no fue necesario cambiar `service-worker.js`. La cache continúa en `ubo-academic-hub-v113` y la prueba de precache sigue pasando.

Career y Room permanecen desactivados:

- `USE_CANONICAL_CAREER=false`
- `USE_CANONICAL_ROOM=false`

UniEcosystemCore no se modifica ni se importa desde esta frontera. No se conectan IdentityPort, SessionPort, AuthorizationContext ni Permission Policy. El Core debe seguir cumpliendo aislamiento de producto y runtime.

## Limitaciones y riesgo de seguridad

`sessionStorage` **no es seguridad institucional**. Los guards controlan el comportamiento de esta aplicación demo y evitan bypasses accidentales mediante URL o estado residual, pero un usuario con herramientas de navegador puede modificar almacenamiento frontend. La producción requerirá autenticación y autorización server-side.

## Rollback

Esta fase modifica `core/demo-identity-session.js`, `core/demo-route-guard.js` y las pruebas de guards existentes; añade `tests/demo-session-hardening.test.js` y este documento. El comportamiento anterior aceptaba una identidad en memoria después de almacenamiento corrupto y el guard no validaba una pareja ID/rol cuando se le entregaba un objeto directo.

El rollback consiste en revertir exclusivamente esos archivos. No requiere tocar usuarios demo, `uboSession`, datos académicos, Career, Room, PWA ni Core.

## Recomendación para Fase 1.49

Diseñar el contrato de transición y cierre de sesión coordinado entre `uboSession` y la selección demo antes de conectar cualquier contrato de identidad o autorización de UniEcosystemCore.
