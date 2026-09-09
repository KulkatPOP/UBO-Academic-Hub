# Cierre de sesión demo y coordinación de identidades

## Estado anterior

La aplicación estudiante conserva `uboSession` en `localStorage`. Los shells aislados de Profesor y Administración usan una identidad demo mínima en `sessionStorage`, bajo `uboDemoIdentityV1`, con únicamente `{ id, role }`.

Antes de esta fase, `clearCurrentDemoIdentity()` ya eliminaba la identidad demo, pero el logout legacy no invocaba esa frontera y los shells Profesor/Admin no ofrecían un cierre explícito.

## Problema resuelto

Una selección demo podía permanecer activa después de cerrar la sesión estudiante, o no tener un mecanismo visible de cierre dentro de Profesor/Admin. La fase centraliza el cierre demo sin migrar ni sustituir la sesión legacy.

## Separación de sesiones

| Capa | Almacenamiento | Responsabilidad |
| --- | --- | --- |
| Aplicación estudiante | `localStorage.uboSession` | Login y datos legacy del estudiante. |
| Entorno demo | `sessionStorage.uboDemoIdentityV1` | Contexto temporal mínimo de rol para Profesor/Admin. |
| UniEcosystemCore | No conectado | Futuro contrato institucional de identidad, sesión y autorización. |

La identidad demo no contiene permisos, contraseñas, tokens, correos ni datos académicos. `uboSession` continúa intacta como contrato legacy salvo cuando su propio logout la elimina.

## Flujo de cierre

`clearCurrentDemoIdentity()` es la operación central y segura de logout demo:

1. elimina `uboDemoIdentityV1` de `sessionStorage`;
2. limpia el estado en memoria de `core/session.js`;
3. evita que el fallback legacy reconstruya una identidad demo en el mismo ciclo de navegación;
4. devuelve `null` si ya no había identidad, sin lanzar errores.

El logout existente de estudiante invoca esa operación antes de eliminar `uboSession`. Los botones de Profesor y Admin invocan la misma operación y reemplazan la ruta actual por el Selector Demo.

## Cambio de perfil

`setCurrentDemoIdentity()` normaliza cada elección contra `data/users.js`, persiste exclusivamente `{ id, role }` y reemplaza el valor anterior. Por ello no puede existir una combinación Carlos + `ADMIN`, Administrador + `TEACHER`, ni propiedades extra que eleven permisos.

## Guards y contenido protegido

Los guards de Profesor y Admin continúan evaluándose antes de renderizar sus dashboards. Tras logout, ambos se deniegan y redirigen al Selector Demo. Son controles de navegación frontend para la demo; no representan autorización de backend.

## Prevención de identidad residual

- valores corruptos, IDs desconocidos y pares ID/rol inconsistentes se deniegan;
- el logout elimina almacenamiento y memoria;
- el cambio de perfil reemplaza completamente la identidad;
- una identidad eliminada no vuelve desde la memoria ni desde el fallback legacy durante el mismo ciclo de navegación;
- una identidad válida persiste solo durante la sesión de la pestaña hasta logout o cierre de pestaña.

## Pruebas

`tests/demo-logout-session-coordination.test.js` cubre logout vacío, logout para los tres roles, limpieza de `sessionStorage` y memoria, denegación de Profesor/Admin posterior, reemplazo de perfil, persistencia válida de sesión y coordinación del logout legacy. Las pruebas de hardening y guards existentes continúan validando corrupción, determinismo y no escalamiento de privilegios.

## Limitaciones y autenticación real

No hay backend, JWT, OAuth, SSO, tokens ni permisos de servidor. La persistencia demo no autentica usuarios y no debe utilizarse como control de seguridad de producción.

## Relación futura con UniEcosystemCore

Esta solución es exclusiva y reversible de UBO Academic Hub. No importa `IdentityPort`, `SessionPort`, `AuthorizationContext` ni políticas del Core, y no crea una dependencia ejecutable UBO → Core. Una migración futura deberá definir un contrato institucional explícito antes de sustituir `uboSession`.

## Rollback

Revertir los cambios de esta fase en `app.js`, los shells Profesor/Admin, la frontera demo, las pruebas y este documento. No requiere tocar datos académicos, credenciales, Career, Room ni UniEcosystemCore.
