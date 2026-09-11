# Fase 1.75 — Ejecución controlada del Identity Canary Teacher

**Run ID:** `F1.75-TEACHER-CARLOS-LOCAL`
**Perfil:** `teacher-carlos-perez` / `TEACHER`
**Estado final de bandera:** `USE_CORE_IDENTITY_CANARY=false`

## Baseline y alcance

La PWA permanece en `ubo-academic-hub-v116`. `USE_CORE_SESSION`, `USE_CANONICAL_CAREER` y `USE_CANONICAL_ROOM` permanecen en `false`. El canario es DEVELOPMENT_ONLY, no persistente y solo se llama desde el shell Profesor cuando UBO ya permitió a Carlos mediante su guard existente.

## Ejecución y MATCH

La activación se ejecutó explícitamente mediante el fixture técnico y las pruebas con `enabled: true`; la configuración por defecto no se cambió. Con Core técnico disponible en `127.0.0.1:3101`, el bridge dinámico solicita solamente `core/identity-snapshot.js`. Core devolvió un snapshot coincidente y el resultado fue `IDENTITY_CANARY_MATCH` para `teacher-carlos-perez / TEACHER`.

El dashboard se renderiza independientemente del resultado: el canario se inicia antes del render, pero no espera ni entrega una decisión al guard, sesión, permisos, navegación o logout.

## Core unavailable, restauración y mismatch

Con Core no disponible el resultado controlado es `CORE_BROWSER_UNAVAILABLE`; Teacher conserva identidad y dashboard. Tras restaurar el servidor, vuelve a producirse `IDENTITY_CANARY_MATCH`.

La simulación en memoria de un snapshot `teacher-carlos-perez / ADMIN` produce `IDENTITY_CANARY_MISMATCH` y no modifica la identidad UBO. También se cubren `CORE_CORS_ERROR`, `CORE_TIMEOUT`, `IDENTITY_ADAPTER_ERROR` e `IDENTITY_SNAPSHOT_INVALID`, siempre en modo fall-open.

## Scope, logout y perfil

Student y Admin devuelven `CORE_IDENTITY_CANARY_OUT_OF_SCOPE` sin consultar Core. La secuencia Carlos → Admin → Carlos no acumula snapshots, listeners ni roles. Logout limpia exclusivamente la identidad demo existente; no existe snapshot persistido ni estado Core que limpiar.

## Sesión, autorización, PWA y seguridad

No se conectan `SessionPort`, `InMemorySession`, `AuthorizationContext` ni Permission Policy. Core no puede cambiar `id`, `role`, permisos, rutas, guards ni almacenamiento. La PWA no se modifica: Core no entra al precache y sigue siendo DEVELOPMENT_ONLY.

Los diagnósticos solo escriben `CANARY_STATE`, `id`, `role`, `result` y categoría de error; no incluyen credenciales, tokens, almacenamiento, cursos ni datos académicos.

## Rollback y limitaciones

El rollback es dejar `USE_CORE_IDENTITY_CANARY=false`, que impide importar o ejecutar el bridge. La bandera queda apagada al cierre de esta fase.

La carga browser usa un import dinámico explícito al servidor Core local porque el adapter Node existente mantiene un import estático por filesystem, no servible desde `localhost:3000`. No es una integración productiva ni un reemplazo de identidad.
