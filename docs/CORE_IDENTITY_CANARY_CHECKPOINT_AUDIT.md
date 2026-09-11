# Fase 1.76 — Auditoría y checkpoint del Identity Canary

**Resultado:** `CORE_IDENTITY_CANARY_CHECKPOINT_READY`.

## Estado final y archivos involucrados

La configuración final conserva `USE_CORE_SESSION=false`, `USE_CORE_IDENTITY_CANARY=false`, `USE_CANONICAL_CAREER=false` y `USE_CANONICAL_ROOM=false`. La PWA continúa en `ubo-academic-hub-v116`.

Los archivos de Fase 1.75 son `config/institution.js`, `modules/professor/teacher-dashboard.js`, `services/adapters/core-identity-canary-runtime.js`, el fixture browser bajo `modules/demo/`, la prueba runtime, la prueba de precache actualizada y la documentación de ejecución. Esta fase agrega el test de checkpoint y este acta; no modifica Core, datos ni Service Worker.

## Arquitectura, flag y alcance

```text
Teacher guard UBO permitido
  → hook condicional de bandera
  → bridge canary DEVELOPMENT_ONLY
  → GET/import dinámico a 127.0.0.1:3101/core/identity-snapshot.js
  → comparación efímera
```

El propietario de `USE_CORE_IDENTITY_CANARY` es `config/institution.js`; su único consumidor runtime es `modules/professor/teacher-dashboard.js`. La carga dinámica sucede solo con bandera `true` y con `teacher-carlos-perez` / `TEACHER`. Student y Admin retornan `CORE_IDENTITY_CANARY_OUT_OF_SCOPE` sin consultar Core.

UBO conserva la fuente de identidad y decide el guard. Core entrega solo un `IdentitySnapshot` para observación. No hay Core → UBO ni copia de Core dentro del proyecto.

## Match, fallos, logout y perfil

El MATCH real en navegador produjo `IDENTITY_CANARY_MATCH`. Con Core detenido se obtuvo `CORE_BROWSER_UNAVAILABLE`; tras restaurarlo volvió el MATCH. Mismatch, CORS, timeout, adapter inválido y snapshot inválido se verifican en memoria como no bloqueantes. Carlos no puede escalar a ADMIN a través de roles, permisos o campos adicionales del snapshot.

La secuencia Carlos → Admin → Carlos mantiene el canario únicamente para Carlos, sin listeners, snapshots ni roles acumulados. Logout limpia la identidad demo normal; el canario no persiste snapshot ni tiene estado que limpiar.

## Student, Admin y guards

Student conserva `uboSession` como autoridad y no consulta Core. Admin tampoco lo consulta. Sin identidad, Student o Admin intentando Teacher son resueltos por `enforceDemoRouteGuard`; Core no participa ni puede redirigir, bloquear o alterar navegación.

## Sesión, autorización, PWA y Core server

No existen consumidores runtime de `SessionPort`, `InMemorySession`, `AuthorizationContext` ni Permission Policy. No se activó sesión ni autorización Core.

El Service Worker v116 incluye el adapter read-only existente y excluye `UniEcosystemCore`, `127.0.0.1:3101` e `identity-snapshot.js`. El bridge canary es DEVELOPMENT_ONLY, dinámico y no ofrece garantía offline; con la bandera apagada no se importa. Core continúa fuera del precache.

`tools/core-dev-server.mjs` queda limitado a `127.0.0.1:3101`, lectura de un único módulo Core, `GET/HEAD`, CORS solo para `http://localhost:3000`, y rechaza origen, método, ruta o traversal no permitidos. Al finalizar la auditoría el servidor debe quedar detenido.

## Pruebas, Git y rollback

La suite verifica flag OFF, MATCH temporal, exclusiones Student/Admin, mismatch, unavailable, CORS, timeout, adapter/snapshot inválidos, escalamiento, logout, perfil, guards, aislamiento de sesión/autorización y PWA. Los tests Core se ejecutan sin modificar ese repositorio.

Rollback no destructivo: confirmar bandera false, detener Core dev server, recargar UBO y comprobar Teacher, Student, Admin, logout y guards. No se toca `uboSession`.

## Riesgos y recomendación Fase 1.77

El canario depende de un servidor Core local y no es una capacidad offline ni de producción. Mantenerlo apagado por defecto y no conectar `SessionPort` todavía. La siguiente fase recomendada es una auditoría de observabilidad y límites de diagnóstico del canario, no una migración de sesión o autorización.
