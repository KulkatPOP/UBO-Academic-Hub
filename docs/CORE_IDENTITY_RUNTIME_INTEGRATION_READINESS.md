# Fase 1.74 — Readiness de integración runtime de Identity Core

**Resultado:** `CORE_IDENTITY_RUNTIME_INTEGRATION_READY`.

Esta fase es una auditoría y contrato de preparación. No activa Identity Core, no modifica los shells de Student, Teacher o Admin y no cambia sesión, permisos, guards, logout, navegación ni PWA.

## Estado actual

- UBO checkpoint base: `ca238a93c2cc15bbf597e643cab26bd02aa42128`.
- Core observado: `414eee6392afa54e93adcc4f6c42d3be08d4387a`.
- PWA: `ubo-academic-hub-v116`.
- Flags: `USE_CORE_SESSION=false`, `USE_CANONICAL_CAREER=false`, `USE_CANONICAL_ROOM=false`.

## Arquitectura e Identity Source

La única dirección permitida es:

```text
UBO identity → core-identity-adapter.js → UniEcosystemCore → IdentitySnapshot
```

No existe Core → UBO ni una copia de Core dentro de UBO. La fuente confiable de Carlos es `data/users.js`: `teacher-carlos-perez` / `TEACHER`. El guard demo ya resuelve esa identidad mediante `getCurrentDemoIdentity()` antes de permitir el shell Teacher.

## Adapter y Core

`services/adapters/core-identity-adapter.js` recibe una identidad UBO ya resuelta, la normaliza contra los usuarios demo y devuelve el `IdentitySnapshot` inmutable de Core. Sus entradas son una identidad `{ id, role }` o una sesión legacy provista por el consumidor; sus salidas son snapshot o `null` para ausencia de identidad. Estructuras presentes inválidas se rechazan con `TypeError`.

Es read-only: no usa DOM, red, almacenamiento, `uboSession`, sesión Core, autorización, permisos ni navegación. El Core solo aporta `createIdentitySnapshot`; continúa externo a UBO.

## Punto mínimo propuesto — no aplicado

Archivo: `modules/professor/teacher-dashboard.js`.

Momento: dentro del bloque `if (teacherRouteGuard.allowed)`, inmediatamente después de que `enforceDemoRouteGuard("TEACHER")` permita el shell y antes de `renderTeacherDashboard()`.

```text
Before: guard Teacher permitido → render Teacher → logout existente
After:  guard Teacher permitido → observar identidad ya resuelta → adapter → snapshot efímero → render Teacher
```

La observación se limita a Carlos y no debe alterar el resultado del guard ni el render. No debe insertarse en login: el guard ya entrega identidad normalizada y evita convertir Core en autoridad. No se aplica este flujo en esta fase.

## Grafo hipotético y precache

Un import futuro desde Teacher agregaría estos assets UBO ya precacheados:

- `services/adapters/core-identity-adapter.js`
- `core/demo-identity-session.js`
- `core/session.js`
- `data/users.js`

El último import es externo: `../../../UniEcosystemCore/core/identity-snapshot.js`. Core no aparece en `DEMO_SHELL_ASSETS`, no se copia a UBO y no se agrega al Service Worker. La prueba PWA confirma grafo local completo, sin ciclos, y exclusión de Core.

## Browser

El servidor técnico local expone exclusivamente `http://127.0.0.1:3101/core/identity-snapshot.js` para el origen `http://localhost:3000`. La página de consumo aislado carga el módulo real y produce `teacher-carlos-perez / TEACHER`.

La página aislada del adapter puede devolver `ADAPTER_BROWSER_LOAD_REQUIRES_CORE`: su import estático de Core no forma parte de la ruta servible de UBO. Es un resultado controlado, no un fallo de Student ni de la PWA, y confirma que se necesita un mecanismo explícito de carga de Core antes de cualquier canario.

## MATCH, mismatch y fallos no bloqueantes

| Situación | Requisito de una fase futura |
| --- | --- |
| Core 200 y snapshot coincidente | Observar el snapshot efímero; UBO conserva identidad, render y permisos. |
| 404, Core apagado, timeout o CORS | Ignorar la observación y continuar el flujo UBO sin logout, redirect ni fallo de guard. |
| Módulo Core inválido o adapter falla | Capturar el error en la capa experimental; no persistir ni alterar sesión. |
| Snapshot inválido | Descartar observación; no reconstruir identidad ni permisos. |
| ID o rol no coinciden | Registrar diagnóstico no sensible y descartar; nunca promover el rol Core. |

No hay privilege escalation: la identidad UBO es la referencia, Core no puede cambiar `id`, `role`, almacenamiento, sesión, permisos, guards ni navegación.

## Sesión, autorización, logout y cambio de perfil

`SessionPort`, `InMemorySession`, `AuthorizationContext` y Permission Policy no están conectados al runtime. Un futuro snapshot será efímero: en logout de Carlos se descarta; no se persiste ni modifica el logout actual.

Para Carlos → Admin → Carlos, la observación futura solo podrá ejecutarse tras un guard Teacher permitido. Student y Admin quedan fuera del alcance y no deben ejecutar el canario.

## Rollback, límites y siguiente fase

El rollback de una futura observación consistirá en retirar solo el hook experimental del shell Teacher; no requiere limpiar sesiones ni caches de Core. Esta fase no introduce el hook.

Antes de una integración real se debe diseñar una carga browser explícita y fail-open hacia el servidor Core local, verificar CORS y timeout, y aprobar un canario Teacher aislado. Identity Core seguirá sin autoridad de sesión ni autorización.
