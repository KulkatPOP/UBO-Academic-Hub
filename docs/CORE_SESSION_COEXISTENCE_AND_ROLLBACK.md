# Coexistencia y rollback de Core Session

## Objetivo y estado actual

Este diseño define qué ocurriría ante una futura activación de Core Session y cómo abortarla sin afectar UBO. Actualmente `USE_CORE_SESSION=false`: la sesión UBO continúa siendo la única fuente de verdad y el Core solo puede observar mediante pruebas aisladas.

| Función | Autoridad actual |
|---|---|
| Login Student | UBO legacy (`uboSession`) |
| Selección demo | demo identity UBO |
| Guard Teacher | UBO guard |
| Guard Admin | UBO guard |
| Logout Student | sesión UBO legacy |
| Logout Teacher/Admin | demo identity UBO |
| Authorization | UBO actual |
| IdentitySnapshot | Observación |
| SessionPort | Inactivo en runtime |
| Core Permission Policy | No conectado |

## Modelo actual, futuro y modos

```text
Actual: Student uboSession / Teacher-Admin demo identity → runtime UBO
Futuro: identidad UBO resuelta → Identity Adapter → IdentitySnapshot → SessionPort
```

Los modos conceptuales son:

| Modo | Flag | Alcance |
|---|---|---|
| 0 — Off | `false` | Core Session inactivo; UBO es autoridad. |
| 1 — Shadow | `false` | Observación y pruebas en memoria; no hay control runtime. |
| 2 — Canary futuro | `true` solo de forma aprobada | Un único flujo/perfil con rollback explícito. No está implementado. |

## Matriz de coexistencia

| Estado | UBO actual | Identity Adapter | IdentitySnapshot | Core Session observada | Resultado con flag OFF |
|---|---|---|---|---|---|
| Student válido | `uboSession` resuelta | Convierte identidad resuelta | STUDENT | Espejo efímero | Student UBO continúa. |
| Teacher válido | demo identity | Convierte identidad resuelta | TEACHER | Espejo efímero | Guard Teacher continúa. |
| Admin válido | demo identity | Convierte identidad resuelta | ADMIN | Espejo efímero | Guard Admin continúa. |
| Ausencia | fuente nula | Devuelve `null` | `null` | `null` | UBO conserva su denegación actual. |
| Identidad inválida | no se cambia | Rechaza | no se crea | no se crea | Runtime UBO no cambia. |
| Error adapter | no se cambia | Error contenido | no se crea | no se actualiza | Diagnóstico; runtime UBO continúa. |
| Error SessionPort | no se cambia | Snapshot válido posible | no controla | Error contenido | Diagnóstico; runtime UBO continúa. |
| Logout | fuente UBO se limpia | Observa ausencia | `null` | espejo limpio | Sin identidad residual. |
| Cambio de perfil | UBO reemplaza identidad | Convierte la nueva | un único rol | reemplaza espejo | No acumula roles. |
| Sesión corrupta/desconocida | guard UBO la deniega | Rechaza | no se crea | no se crea | Sin fallback permisivo. |
| Par ID/rol inválido | no se cambia | Rechaza | no se crea | no se crea | Sin escalamiento. |

## Perfiles y seguridad

Sofía se observa desde una identidad derivada de `uboSession`; Carlos y Administrador desde demo identity. Ninguno de estos mecanismos se reemplaza. Campos adicionales como `permissions` o `isAdmin` no cambian el único role claim permitido. No se crean identidades artificiales, roles sintéticos, fallback permisivo ni sesiones residuales.

## Logout y cambio de perfil

El logout vigente limpia la fuente UBO correspondiente. La observación debe producir `null` y limpiar solamente su espejo efímero. Sofía → Carlos → Admin → Sofía reemplaza completamente el snapshot por `{ id, roles: [rol] }`; no combina roles.

## Criterios para Canary y criterios de aborto

Un Canary no puede iniciarse hasta que existan equivalencia de identidad, pruebas Shadow completas, logout/perfil/ausencia equivalentes, rechazo de invalid input, inmutabilidad, determinismo, ausencia de stale identity y regresiones Student/Teacher/Admin en cero.

Se debe abortar inmediatamente ante snapshot, ID o rol diferente; sesión residual; logout inconsistente; excepción no controlada; acceso indebido; pérdida de acceso válido; escalamiento; no determinismo o corrupción. El abortar es explícito y fail-closed: no se implementa rollback automático porque podría ocultar un incidente.

## Rollback

```text
Canary aprobado y temporal → hallazgo → USE_CORE_SESSION=false → UBO legacy/demo identity vuelve a ser la única fuente
```

El rollback no borra datos académicos, credenciales ni usuarios; no cambia adapters, Core, Career, Room ni PWA. En esta fase la bandera permanece apagada, por lo que este flujo es solo diseño validado por fixture.

## Límites y próxima fase

No hay persistencia Core, autenticación real, autorización Core, backend, red, cookies, tokens ni cambio de rutas. UniEcosystemCore continúa independiente. La próxima fase debe ser una especificación de Canary con perfil único, telemetría de diagnóstico no sensible y procedimiento manual de aprobación/abort, sin habilitar todavía la bandera.
