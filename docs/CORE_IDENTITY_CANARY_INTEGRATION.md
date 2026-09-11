# Fase 1.69 — Identity Core Canary en modo shadow

**Fecha:** 2026-09-09
**Resultado:** `CORE_IDENTITY_CANARY_BLOCKED`

## 1. Objetivo y alcance

Esta fase evaluó un canario de identidad **solo observacional** para Carlos Pérez (`teacher-carlos-perez`, `TEACHER`). UBO mantiene toda autoridad de identidad, sesión, navegación, guards y autorización.

No se modificaron UniEcosystemCore, `app.js`, Student, Admin, login, logout, guards, datos, credenciales ni flags. No se activaron SessionPort ni Authorization Core.

## 2. Adapter e IdentitySnapshot

El adapter existente `services/adapters/core-identity-adapter.js` recibe una identidad UBO ya resuelta y usa:

```text
identidad UBO { id, role }
  → adaptUboIdentityToCoreSnapshot()
  → IdentitySnapshot { id, roles: [role] }
```

Solo acepta una pareja `id` + `role` registrada en `data/users.js`. Ignora propiedades arbitrarias tales como `permissions`, `isAdmin` y `roles` adicionales. Sofía, Carlos y Administrador producen snapshots correctos en pruebas aisladas; el scope de este canario es exclusivamente Carlos.

## 3. Punto de integración propuesto y bloqueo

El punto seguro sería el bloque `if (teacherRouteGuard.allowed)` de `modules/professor/teacher-dashboard.js`, inmediatamente después de que UBO resuelve y valida la identidad Teacher.

No se conectó allí. El adapter importa:

```text
../../../UniEcosystemCore/core/identity-snapshot.js
```

La resolución local apunta fuera del root de UBO, a `C:\Users\shari\Desktop\UniEcosystemCore\core\identity-snapshot.js`. El servidor de UBO responde **404** para `/UniEcosystemCore/core/identity-snapshot.js`.

Por tanto, incorporar el adapter al shell Profesor produciría un import ESM no servido y fuera de la cobertura PWA. La Fase 1.69 exige detenerse ante `PWA_PRECACHE_MISSING_ASSETS` en lugar de modificar automáticamente el Service Worker o copiar Core dentro de UBO. Se preservó la integridad runtime y se bloqueó la activación productiva.

## 4. Harness aislado de canary

Se agregó `tests/core-identity-canary.test.js`. Es un harness Node, no un módulo runtime, sin estado persistente y sin consumidores desde interfaces. Su flujo es:

```text
identidad UBO fixture ya resuelta
  → Identity Adapter
  → IdentitySnapshot
  → comparación pasiva id / role
  → diagnóstico
```

Estados controlados:

- `IDENTITY_CANARY_MATCH`
- `IDENTITY_CANARY_MISMATCH`
- `IDENTITY_CANARY_INVALID`
- `IDENTITY_CANARY_ADAPTER_ERROR`
- `IDENTITY_CANARY_NOT_RUN`

El harness no registra contraseñas, tokens, cookies, storage completo ni datos académicos; conserva solo `id`, `role`, estado y tipo de error.

## 5. Resultados del harness

| Escenario | Resultado |
| --- | --- |
| Carlos válido | `IDENTITY_CANARY_MATCH` |
| Sofía | `IDENTITY_CANARY_NOT_RUN` (fuera de scope) |
| Admin | `IDENTITY_CANARY_NOT_RUN` (fuera de scope) |
| ID/rol incompatibles | `IDENTITY_CANARY_INVALID`; no se convierte identidad no resuelta en canario Teacher |
| Snapshot Carlos/ADMIN | `IDENTITY_CANARY_MISMATCH`; UBO conserva Carlos/TEACHER |
| Snapshot corrupto | `IDENTITY_CANARY_INVALID` |
| Error del adapter | `IDENTITY_CANARY_ADAPTER_ERROR`; UBO continúa |
| Core ausente simulado | `IDENTITY_CANARY_NOT_RUN`; adapter no se invoca |
| Cambio Carlos → Admin → Carlos | Solo Carlos observa; no se acumulan roles |
| Logout Carlos | Sin snapshot residual ni acceso Teacher posterior |
| Datos extra de privilegio | No provocan escalamiento |

## 6. Fail-open y fronteras

Core es observador. Match, mismatch, error o ausencia no llaman login, logout, sesión, router, guard ni permisos. El guard de ruta UBO permanece como autoridad y el acceso directo a Teacher sin identidad sigue redirigiendo al Selector.

- Student queda fuera del canario productivo.
- Admin queda fuera del canario productivo.
- SessionPort, Authorization, Career y Room quedan fuera.
- `USE_CORE_SESSION=false`, `USE_CANONICAL_CAREER=false` y `USE_CANONICAL_ROOM=false`.

## 7. PWA, navegador y pruebas

`tests/pwa-esm-precache.test.js` permanece correcto para Selector, Profesor y Admin. No se agregó el adapter al runtime, por lo que no se introdujo ningún import externo ni se modificó PWA en esta fase.

La verificación del Selector/PWA de Fase 1.68 se conserva. Una prueba de navegador del canario runtime no corresponde mientras el Core no sea un módulo servible por el shell UBO; activar un import que falla 404 solo para observarlo violaría el fail-open y el criterio de no regresión.

El Core permaneció sin modificaciones funcionales; `npm test` y `npm run check` se ejecutan como validación de integridad.

## 8. Rollback

El rollback es trivial porque no se integró ningún observador en runtime: no hay flag nueva, identidad Core almacenada, SessionPort, import de shell ni cambio de navegación que revertir. Eliminar el harness de prueba en una fase futura no afectaría a UBO.

## 9. Recomendación para Fase 1.70

No avanzar a un canario runtime todavía. Primero definir una frontera de entrega válida para Core: paquete/versionado publicable, artefacto ESM servible por el host de UBO o import map/bundling aprobado. Esa decisión debe incluir compatibilidad PWA y una prueba de precache antes de tocar Teacher.

Solo después se puede volver a evaluar el punto de observación Teacher, manteniendo UBO como autoridad y el canario fail-open.
