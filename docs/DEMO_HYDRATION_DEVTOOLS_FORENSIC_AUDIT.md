# Auditoría forense DevTools / Network — hidratación demo

> **RESULT: HYDRATION_ROOT_CAUSE_UNRESOLVED**
> **DATE: 2026-09-09**
> **CANARY_AUTHORIZATION: NOT_GRANTED**
> **CANARY_EXECUTION: NOT_STARTED**
> **USE_CORE_SESSION: false**

## A. Entorno

- UBO checkpoint: `ca238a93c2cc15bbf597e643cab26bd02aa42128`.
- Core checkpoint: `414eee6392afa54e93adcc4f6c42d3be08d4387a`.
- PWA declarada: `ubo-academic-hub-v114`.
- Navegador observado: Chrome y navegador interno del entorno de automatización, sobre `http://localhost:3000`.

No se activó `USE_CORE_SESSION`; Career y Room permanecen en `false`. No se abrió DevTools ni se alteraron sus opciones porque la interfaz de automatización disponible no expone Console, Network, Application ni Cache Storage.

## B. Student baseline

| Campo | Observación |
| --- | --- |
| URL | `http://localhost:3000/` |
| Render | Correcto: login/dashboard, Sofía, resumen y navegación visibles. |
| Entrypoint | `app.js` se comporta como ejecutado. |
| Console/Network | No accesibles mediante la herramienta. |
| Service Worker/cache | No inspeccionables en tiempo de ejecución. |

Student confirma que el origen no está completamente indisponible y que el shell principal puede hidratar.

## C. Selector

| Campo | Observación |
| --- | --- |
| URL solicitada | `/modules/demo/demo-selector.html` |
| HTML interno | Shell del selector visible. |
| Render | `#demo-users` permanece vacío. |
| Entrypoint estático | `./demo-selector-ui.js`, `type="module"`. |
| Grafo estático | `demo-selector-ui.js` → `demo-selector.js` / `demo-router.js` → identidad, permisos, sesión y usuarios demo. |
| Chrome externo | Finaliza en `http://localhost:3000/` con login Student. |

## D. Teacher

| Campo | Observación |
| --- | --- |
| URL solicitada | `/modules/professor/teacher-dashboard.html` |
| HTML interno | Shell Teacher visible. |
| Render | `#teacher-title` vacío; resumen, cursos y acciones no se generan. |
| Entrypoint estático | `./teacher-dashboard.js`, `type="module"`. |
| Guard estático | Sin identidad, `enforceDemoRouteGuard()` apunta a `../demo/demo-selector.html`. |
| Chrome externo | Finaliza en raíz/login. |

No hay evidencia de que `renderTeacherDashboard()` sea llamado en la reproducción.

## E. Admin

| Campo | Observación |
| --- | --- |
| URL solicitada | `/modules/admin/admin-dashboard.html` |
| HTML interno | Shell Admin visible. |
| Render | `#admin-name` mantiene `Cargando…`; no se generan resumen, gestión ni estadísticas. |
| Entrypoint estático | `./admin-dashboard.js`, `type="module"`. |
| Guard estático | Sin identidad, `enforceDemoRouteGuard()` apunta a `../demo/demo-selector.html`. |
| Chrome externo | Finaliza en raíz/login. |

No hay evidencia de que `renderAdminDashboard()` sea llamado en la reproducción.

## F. Network

| Recurso | Status | Content-Type | Initiator | Fuente | Resultado |
| --- | --- | --- | --- | --- | --- |
| Student document | No expuesto | No expuesto | No expuesto | No expuesto | Render correcto. |
| Selector document/ESM | No expuesto | No expuesto | No expuesto | No expuesto | Shell sin hidratación; Chrome externo termina en raíz. |
| Teacher document/ESM | No expuesto | No expuesto | No expuesto | No expuesto | Shell sin hidratación; Chrome externo termina en raíz. |
| Admin document/ESM | No expuesto | No expuesto | No expuesto | No expuesto | Shell sin hidratación; Chrome externo termina en raíz. |

Abrir un archivo `.js` como documento devolvió `net::ERR_FAILED` desde la automatización, incluso para `app.js`; por ello no es evidencia admisible de un error ESM, MIME o HTTP del módulo.

## G. Console

No se pudo capturar consola, stack trace, línea o columna. No se inventan errores JavaScript.

## H. ESM

Los entrypoints y sus grafos estáticos existen. `node --check` y la suite UBO pasan. El navegador, sin embargo, no produjo evidencia observable de ejecución de los entrypoints demo.

## I. Service Worker

`service-worker.js` se inspeccionó solo en lectura:

- Usa `ubo-academic-hub-v114`.
- Documentos usan network-first y, al fallar, el fallback final es `./index.html`.
- Assets usan cache-first y luego red.
- `OFFLINE_DOCUMENTS` solo declara Teacher y Admin.

No se inspeccionó el controller, scope o estado real de Cache Storage porque no está expuesto por la herramienta.

## J. Cache

### Hecho confirmado

El Selector Demo no está representado en `DEMO_SHELL_ASSETS`, `PRECACHE_ASSETS` ni `OFFLINE_DOCUMENTS`. Faltan su HTML, CSS, UI entrypoint y módulos locales.

### Estado

`CACHE_ASSET_MISSING` aplica al grafo de precache del Selector. `CACHE_STALE_SUSPECTED` se mantiene como hipótesis para la diferencia entre navegador interno y Chrome externo; no se verificó contenido cacheado ni se eliminó cache.

## K. Redirects

La cadena estática permite este flujo cuando no existe identidad demo:

`Teacher/Admin` → guard UBO → `../demo/demo-selector.html` → fallback documental `./index.html` si Selector no puede obtenerse.

La navegación de Chrome al root/login es consistente con dicha cadena, pero no prueba si el primer salto lo emitió el servidor, Service Worker o el guard. No se declara `DEMO_ROUTE_REDIRECT` como causa comprobada.

## L. Identity

No se imprimieron ni modificaron credenciales, `sessionStorage` ni `localStorage`. La identidad no puede ser la primera falla del Selector porque el listado de perfiles se renderiza antes de seleccionar identidad.

## M. Session

Pruebas de hardening, logout y coexistencia pasan. Core Session sigue inactiva. No hay evidencia de sesión residual en esta auditoría forense.

## N. Guards

Los tests de guards pasan. Teacher/Admin pueden redirigir por falta de identidad según su código estático, pero no hay traza de ejecución real que atribuya el síntoma al guard.

## O. Render

Los elementos destino existen. Selector no llena `#demo-users`; Teacher no llena título/resumen/cursos; Admin no reemplaza `Cargando…`. Esto demuestra que el render final no ocurre, no el motivo exacto que lo evita.

## P. Primer fallo

`FIRST_RUNTIME_MODULE_FAILURE: NOT_CAPTURED`.

`FIRST_OBSERVABLE_FAILURE: rutas/entrypoints demo no producen hidratación dinámica en navegador`.

## Q. Clasificación

`UNKNOWN`, con una omisión estática adicional `CACHE_ASSET_MISSING` para Selector.

## R. Causa raíz

`HYDRATION_ROOT_CAUSE_UNRESOLVED`.

No existe evidencia de status HTTP, MIME, source de cache/red, consola ni stack para afirmar una causa única. La única causa parcial demostrada es que el Selector carece de representación en el precache/fallback del Service Worker.

## S. Evidencia

1. Student funciona en el mismo origen.
2. Los tres shells demo no hidratan sus datos.
3. Chrome externo termina en raíz/login para las rutas demo.
4. El Selector no está incluido en los arrays de assets/fallback del Service Worker.
5. Sintaxis, tests de identidad, sesión, logout, guards, shadow, coexistencia y PWA static graph pasan.

## T. Limitaciones

La herramienta de navegador no provee DevTools, request log, response headers, Console, Cache Storage ni controller del Service Worker. No se realizaron acciones destructivas para suplir esa limitación: no se limpió sitio, no se eliminaron caches y no se desregistró el Service Worker.

## U. Recomendación

Antes de modificar PWA, server o módulos, repetir la captura manual en DevTools del navegador que hospeda `localhost:3000`, con Preserve log y Disable cache temporales. Registrar el primer request fallido y sus status/MIME/fuente. Esa evidencia es necesaria para elegir entre una corrección de hosting/rutas, Service Worker/precache o ESM.

El canario permanece no autorizado y no ejecutado.
