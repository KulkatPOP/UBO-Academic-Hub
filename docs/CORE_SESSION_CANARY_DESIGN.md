# Diseño de canario controlado para Core Session

## Objetivo y perfil elegido

El primer canario futuro queda limitado exclusivamente a Carlos Pérez: `teacher-carlos-perez` con rol `TEACHER`. Teacher es el candidato menos invasivo porque ya usa demo identity y un guard aislado; Student conserva login/`uboSession` legacy y Admin queda fuera para no afectar gestión institucional. Este documento no habilita el canario.

## Tres modos

| Modo | Flag | Autoridad |
|---|---|---|
| 0 — Legacy | `USE_CORE_SESSION=false` | UBO controla runtime. |
| 1 — Shadow | `USE_CORE_SESSION=false` | UBO controla; Core solo observa en pruebas. |
| 2 — Canary futuro | `true` solo tras aprobación | Core podría controlar únicamente Teacher. No implementado. |

No se crea todavía `CORE_SESSION_CANARY_PROFILE`: sería configuración inactiva mientras el canario no exista. Si se aprueba, deberá tener un único propietario junto a `USE_CORE_SESSION`.

## Matriz de autoridad

| Función | Legacy | Core Canary futuro |
|---|---|---|
| Login | UBO resuelve credenciales | UBO sigue resolviendo; Core nunca recibe credenciales. |
| Identidad | UBO demo identity | Se compara con snapshot Teacher. |
| Sesión | demo identity UBO | SessionPort efímero solo para Teacher. |
| Navegación | UBO | UBO hasta aprobación de una ruta concreta. |
| Guard | UBO guard | UBO guard sigue autoridad inicial. |
| Logout | UBO limpia demo identity | Debe limpiar además el espejo Core; de fallar, abortar. |
| Cambio de perfil | UBO reemplaza identidad | Limpiar espejo al salir de Teacher. |
| Acceso directo | Guard/redirección UBO | Core no puede crear identidad desde URL. |
| Error adapter/SessionPort | UBO no cambia | Abort manual a Legacy. |

Student y Admin permanecen siempre fuera del canario. Career, Room, AuthorizationContext y Permission Policy no forman parte de su alcance.

## Contratos de identidad y sesión

La única equivalencia aprobada para este diseño es:

```js
{ id: "teacher-carlos-perez", role: "TEACHER" }
// equivale a
{ id: "teacher-carlos-perez", roles: ["TEACHER"] }
```

El rol UBO singular debe corresponder a un único role claim. Esta regla no se generaliza automáticamente a perfiles multirol. SessionPort recibe solo un `IdentitySnapshot` ya resuelto: no conoce almacenamiento, credenciales, DOM, router ni URLs.

## Login, logout, cambios y acceso directo

El login actual no se modifica. Una eventual sincronización canario ocurriría después de que UBO resolviera Teacher. En logout, ambas identidades deberían quedar nulas; si una limpieza falla, el canario falla y se vuelve manualmente a Legacy. Teacher → Admin/Student exige limpiar inmediatamente el espejo Teacher; Teacher → logout → acceso directo debe dejar el puerto en `null` y conservar la denegación/redirección UBO.

## Fallos y abortos

Los siguientes escenarios fuerzan `CANARY FAIL` y abort manual: fallo de adapter; fallo de `getCurrentIdentity`, `setCurrentIdentity` o `clear`; snapshot o rol distinto; identidad corrupta; sesión residual; error no controlado; acceso indebido; pérdida de acceso válido; no determinismo; modificación de datos o Core.

No hay fallback permisivo, identidad inventada, selección alternativa de rol ni sesión parcial. Las propiedades `permissions`, `isAdmin`, `roles` o extras no pueden elevar a Teacher.

## Rollback

```text
Canary futuro → hallazgo → USE_CORE_SESSION=false → recargar runtime → UBO vuelve a ser autoridad
```

El rollback es manual, explícito, fail-closed y documentable con escenario, resultado, motivo y acción. No se implementa rollback automático porque podría ocultar una falla. No altera datos, credenciales, usuarios, adapters, Core, Career, Room ni PWA.

## Checklist de activación futura

- [ ] Shadow completo y equivalencia Teacher validada.
- [ ] Login, logout, perfil, ausencia e invalid input estables.
- [ ] Sin stale session, escalamiento ni errores de navegación.
- [ ] Student y Admin sin regresiones.
- [ ] SessionPort y adapter estables.
- [ ] PWA intacta; Career y Room OFF; Core intacto.
- [ ] Rollback manual probado y aprobado.

## Límites y próxima fase

No existe canario activo, autenticación real, backend, persistencia, autorización Core ni cambio de guards. La próxima fase debe definir procedimiento operativo de aprobación, diagnóstico no sensible y ejecución manual de abort para un único flujo Teacher, sin cambiar aún la bandera.
