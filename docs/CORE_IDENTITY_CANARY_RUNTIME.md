# Fase 1.72 — Identity Core Canary Runtime real

**Resultado:** `CORE_IDENTITY_CANARY_BLOCKED`
**Motivo de bloqueo:** `PWA_PRECACHE_MISSING_ASSETS services/adapters/core-identity-adapter.js`

## Objetivo y perfil

El objetivo era observar exclusivamente a Carlos Pérez (`teacher-carlos-perez`, `TEACHER`) desde el shell Profesor mediante:

```text
identidad UBO ya resuelta → Identity Adapter → Core real → IdentitySnapshot → comparación
```

UBO debía seguir siendo autoridad única de sesión, login, logout, navegación, guards, autorización y roles.

## Precondiciones confirmadas

- El servidor de desarrollo Fase 1.71 escucha solo en `127.0.0.1:3101`.
- Expone únicamente `/core/identity-snapshot.js`.
- CORS acepta solo `http://localhost:3000`; no usa credenciales ni wildcard.
- Traversal y rutas fuera de whitelist se rechazan.
- El Core real puede crear en navegador el snapshot de Carlos en la página técnica aislada.
- `USE_CORE_SESSION=false`, `USE_CANONICAL_CAREER=false` y `USE_CANONICAL_ROOM=false`.

## Bloqueador detectado

El shell `modules/professor/teacher-dashboard.js` está precacheado, pero `services/adapters/core-identity-adapter.js` no está incluido en `DEMO_SHELL_ASSETS` de `service-worker.js`.

Un import runtime del adapter desde Teacher añadiría un módulo no cubierto por el contrato PWA actual. La Fase 1.72 prohíbe modificar `service-worker.js`, mantener `ubo-academic-hub-v115` y exige `PWA_PRECACHE_COVERAGE_OK`. Esas condiciones impiden una activación segura del observador runtime.

No se añadió el import. Por tanto, no existe riesgo de que Core afecte Teacher cuando el servidor local esté apagado.

## Validación reproducible

`tests/core-identity-canary-runtime.test.js` verifica que:

- Teacher no importa el adapter ni Core en runtime;
- la incorporación prospectiva del adapter generaría exactamente el asset PWA faltante;
- el adapter actual produce en Node el snapshot correcto de Carlos;
- un snapshot Teacher/Admin solo es un mismatch fixture y no modifica la identidad UBO;
- flags, SessionPort y Authorization permanecen fuera del shell.

El resultado esperado de la prueba es un bloqueo documentado, no una activación oculta:

```text
RUNTIME_CANARY_IMPORT_NOT_ACTIVATED
PWA_PRECACHE_MISSING_ASSETS services/adapters/core-identity-adapter.js
IDENTITY_CANARY_MATCH_NODE_ONLY
IDENTITY_CANARY_MISMATCH_NON_BLOCKING_FIXTURE_OK
UBO_RUNTIME_UNCHANGED
CORE_IDENTITY_CANARY_RUNTIME_BLOCKED_BY_PWA
```

## Browser, sesión, logout y guards

La importación técnica aislada del Core en navegador se comprobó en Fase 1.71. El shell Teacher no fue modificado en esta fase, por lo que sigue utilizando únicamente identidad y guards UBO. Student y Admin permanecen fuera. No existe snapshot runtime persistente, y no se intervino logout, cambio de perfil, acceso directo ni navegación.

## PWA y rollback

No se modificaron `service-worker.js`, `ubo-academic-hub-v115` ni el precache. Core sigue fuera de PWA y el servidor Core sigue clasificado como `DEVELOPMENT_ONLY`.

El rollback es nulo: no se agregó observador runtime. Detener el servidor Core local deja UBO exactamente en su comportamiento previo.

## Recomendación para Fase 1.73

Antes de reintentar el canario runtime, autorizar explícitamente una fase PWA que agregue el adapter UBO al grafo precacheado, manteniendo Core remoto de desarrollo fuera del precache. Esa fase debe validar online, offline y fail-open antes de importar el adapter desde Teacher.

No avanzar a Session Core ni Authorization Core.
