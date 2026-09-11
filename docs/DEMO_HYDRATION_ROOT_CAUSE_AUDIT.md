# Diagnóstico de hidratación web — shells demo

> **RESULT: HYDRATION_ROOT_CAUSE_UNRESOLVED**
> **DATE: 2026-09-09**
> **CANARY_AUTHORIZATION: NOT_GRANTED**
> **CANARY_EXECUTION: NOT_STARTED**
> **USE_CORE_SESSION: false**

## A. Estado general

La causa completa no puede declararse identificada con evidencia suficiente. La auditoría encontró un fallo reproducible antes de la hidratación y una omisión objetiva en el precache del Selector Demo, pero el entorno de automatización no expone encabezados HTTP, consola ni panel Network para atribuir de forma concluyente la falla de Teacher/Admin a un recurso ESM individual.

No se modificó código, PWA, Service Worker, sesiones, guards, datos, flags ni Core.

## B. Reproducción

| Superficie | URL solicitada | Resultado observado |
| --- | --- | --- |
| Student | `http://localhost:3000/` | Carga completa: login/dashboard, datos de Sofía y script principal operativos. |
| Selector | `http://localhost:3000/modules/demo/demo-selector.html` | En navegador interno recibe el shell, pero `#demo-users` queda vacío. En Chrome externo la navegación termina en el documento raíz/login. |
| Teacher | `http://localhost:3000/modules/professor/teacher-dashboard.html` | En navegador interno recibe shell, pero `#teacher-title`, resumen, cursos y acciones quedan sin hidratar. En Chrome externo la navegación termina en el documento raíz/login. |
| Admin | `http://localhost:3000/modules/admin/admin-dashboard.html` | En navegador interno recibe shell, pero `#admin-name` conserva `Cargando…` y no se renderizan secciones. En Chrome externo la navegación termina en el documento raíz/login. |

Se esperó la carga de los módulos antes de inspeccionar los elementos. No se alteró sesión ni se seleccionó un perfil demo.

## C. Student

Student es la referencia funcional: `index.html` y `app.js` hidratan correctamente en el mismo origen. Por ello el problema no es una indisponibilidad total del origen ni una falla general de JavaScript.

## D. Selector

### HTML y entrypoint

- HTML: `modules/demo/demo-selector.html`.
- Entry ESM: `./demo-selector-ui.js`.
- Grafo: `demo-selector-ui.js` → `demo-selector.js` / `demo-router.js` → `data/users.js`, `core/demo-identity-session.js`, `core/permissions.js`, `core/session.js`.

### Hallazgo verificable

Ninguno de estos recursos está en `DEMO_SHELL_ASSETS` ni en `OFFLINE_DOCUMENTS` de `service-worker.js`:

- `modules/demo/demo-selector.html`
- `modules/demo/demo-selector.css`
- `modules/demo/demo-selector-ui.js`
- `modules/demo/demo-selector.js`
- `modules/demo/demo-router.js`

Por tanto, cuando el origen no responde, el selector no posee una ruta de respaldo cacheada. El `fetch` del Service Worker termina usando `./index.html` como fallback documental para una navegación no contemplada.

### SELECTOR_FAILURE_POINT

El primer punto observable es previo a `renderDemoUsers()`: el navegador recibe el shell sin contenido dinámico y no hay evidencia de ejecución del entrypoint. La falta de assets selector en precache explica de forma directa su incapacidad de funcionar sin red, pero no prueba por sí sola el estado HTTP exacto de la sesión observada.

## E. Teacher

- HTML: `modules/professor/teacher-dashboard.html`.
- Entry ESM: `teacher-dashboard.js`.
- Grafo principal: `teacher-dashboard.js` → `dashboard.js`, `core/demo-route-guard.js`, `core/demo-identity-session.js` → servicios y datos institucionales.
- El Service Worker actual sí declara los entrypoints y dependencias directas principales de Teacher.

No se alcanza evidencia de `enforceDemoRouteGuard()` ni de `renderTeacherDashboard()`: el shell permanece estático. Los tests de guards, sesión, perfiles y rutas pasan, por lo que no hay evidencia de que el bloqueo ocurra en identidad o autorización.

## F. Admin

- HTML: `modules/admin/admin-dashboard.html`.
- Entry ESM: `admin-dashboard.js`.
- Grafo principal: `admin-dashboard.js` → `admin-service.js`, `administrative-action-service.js`, guards e identidad demo.
- El Service Worker actual declara los entrypoints y dependencias directas principales de Admin.

No se alcanza evidencia de `enforceDemoRouteGuard()` ni de `renderAdminDashboard()`: `#admin-name` mantiene el texto estático `Cargando…`. Los tests de guards, sesión y perfiles pasan, por lo que no existe evidencia de un fallo de rol o permiso.

## G. Network

| Recurso | Status / Content-Type | Cargó | Evidencia |
| --- | --- | --- | --- |
| `/` | No expuesto por la herramienta | Sí | Student hidrata. |
| Selector document | No expuesto | Inconsistente | Shell interno; Chrome externo termina en raíz/login. |
| Teacher document | No expuesto | Inconsistente | Shell interno; Chrome externo termina en raíz/login. |
| Admin document | No expuesto | Inconsistente | Shell interno; Chrome externo termina en raíz/login. |
| Entrypoints `.js` abiertos como documento | `ERR_FAILED` reportado por la automatización | No concluyente | La misma limitación ocurre para `app.js`, por lo que no se usa como evidencia de MIME. |

La herramienta disponible no permite capturar HTTP status, `Content-Type`, consola ni requests individuales de módulos. Por ello no se afirma un 404, MIME inválido, CORS o error ESM sin evidencia.

## H. ESM

Todos los JavaScript relevantes pasan `node --check`; la suite de pruebas UBO completa pasa. Los grafos estáticos existen y el precache test reporta cobertura para Professor/Admin.

El grafo del Selector no forma parte del precache actual. Esto es una discrepancia estática confirmada. No se puede nombrar un `FIRST_RUNTIME_MODULE_FAILURE` para Teacher/Admin porque el navegador observado no expone cuál import falló ni su respuesta.

## I. Service Worker

- Versión declarada: `ubo-academic-hub-v114`.
- Estrategia documental: network-first; ante fallo devuelve el documento cacheado solicitado, `OFFLINE_DOCUMENTS[pathname]` o `./index.html`.
- Estrategia de assets: cache-first y luego red.
- `OFFLINE_DOCUMENTS` incluye Teacher/Admin, pero no Selector.

La ruta de fallback explica que una navegación demo sin red pueda terminar en el root de Student. No se inspeccionó ni modificó el contenido real de Cache Storage.

## J. Cache

**CACHE_STALE_SUSPECTED: sí, no confirmado.**

La observación contradictoria entre navegadores —shell demo en el navegador interno y root/login en Chrome externo— es consistente con disponibilidad diferente de cache/documento o con una topología de servidor local que no expone las rutas demo de manera uniforme. La versión `v114` no puede por sí sola demostrar que el contenido guardado corresponde al archivo físico actual.

No se eliminaron caches, no se actualizó la versión y no se modificó el Service Worker.

## K. Identity

No hay evidencia de fallo de identidad. Las pruebas de demo identity, adapter, shadow, hardening y perfiles pasan. Además, Selector falla antes de listar usuarios, antes de que una selección pueda resolver identidad.

## L. Session

No hay evidencia de sesión residual o Core Session activa. `USE_CORE_SESSION=false`; Student mantiene `uboSession`; Teacher/Admin usan demo identity y memoria/sesión UBO. Las pruebas de logout y coexistencia pasan.

## M. Guards

No hay evidencia de error de guard. Las pruebas de rutas Student/Teacher/Admin y casos negativos pasan. En la reproducción no se alcanza un render o redirección observable que permita adjudicar la falla al guard.

## N. Render

Los contenedores HTML existen, pero la hidratación no los llena. Esto sitúa el síntoma antes de render final, sin evidencia suficiente para clasificarlo como fallo interno de `renderDemoUsers`, `renderTeacherDashboard` o `renderAdminDashboard`.

## O. Primer punto de fallo

`FIRST_OBSERVABLE_FAILURE = carga de ruta/documento y entrypoint ESM demo en navegador`.

Para Selector, el primer módulo candidato es `modules/demo/demo-selector-ui.js`; su cadena no está en el precache. Para Teacher/Admin, el primer módulo individual fallido permanece indeterminado.

## P. Causa raíz

**ROOT_CAUSE_CLASSIFICATION: UNKNOWN**

La evidencia permite confirmar dos factores:

1. **SERVICE_WORKER / CACHE gap confirmado para Selector:** el grafo completo del Selector no está en el precache ni en la tabla de fallback documental.
2. **HTTP/cache-topology inconsistente sospechada para shells demo:** Chrome externo recibe el root/login al solicitar rutas demo, mientras el navegador interno recibe shells que no hidratan.

No se declara una causa única para Teacher/Admin porque faltan status, MIME y errores de consola por recurso.

## Q. Evidencia

- Student hidrata en el mismo `localhost:3000`.
- Selector, Teacher y Admin no hidratan sus contenedores tras espera de carga.
- La solicitud Chrome de rutas demo termina en `http://localhost:3000/` con el login de Student.
- El código fuente del Service Worker omite completamente los assets del Selector y usa `./index.html` como fallback final.
- `node --check` no reporta errores y las 14 pruebas UBO más el adapter pasan.

## R. Archivos involucrados

- `modules/demo/demo-selector.html`
- `modules/demo/demo-selector-ui.js`
- `modules/demo/demo-selector.js`
- `modules/demo/demo-router.js`
- `modules/professor/teacher-dashboard.html`
- `modules/professor/teacher-dashboard.js`
- `modules/admin/admin-dashboard.html`
- `modules/admin/admin-dashboard.js`
- `service-worker.js` — inspeccionado solamente

## S. Qué no se modificó

No se modificaron `service-worker.js`, `app.js`, dashboards, login/logout, guards, sesión, adapters, Core, datos, flags, cache names ni PWA.

## T. Riesgo

Autorizar o ejecutar un canario Teacher sin una reproducción de navegador confiable ocultaría una regresión independiente de Core Session. Corregir prematuramente el PWA podría enmascarar una eventual falla HTTP o MIME.

## U. Recomendación

Antes de una fase correctiva, realizar una única inspección diagnóstica adicional con DevTools/Network del navegador que controla `localhost:3000`, capturando para cada documento y módulo: URL, status, `Content-Type`, fuente cache/red y primer error de consola. Confirmar primero si el host local sirve las rutas demo o si la respuesta es el fallback root. Solo después decidir una corrección aislada del PWA/servidor; no activar `USE_CORE_SESSION` ni el canario.

`HYDRATION_ROOT_CAUSE_UNRESOLVED` no autoriza una ejecución ni significa éxito del canario.
