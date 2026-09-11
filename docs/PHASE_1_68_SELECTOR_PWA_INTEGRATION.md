# Fase 1.68 — Cierre del bloqueador del Selector Demo

**Fecha:** 2026-09-09
**Alcance:** Selector Demo y su cobertura PWA. No se integró UniEcosystemCore, SessionPort ni Authorization Core.

## 1. Estado inicial y bloqueador Fase 1.67

La auditoría 1.67 identificó dos hechos:

1. El Selector Demo funcionaba online, pero no era parte del shell precacheado.
2. En una navegación documental sin red, al no existir una entrada específica en `OFFLINE_DOCUMENTS`, la ruta del Selector terminaba usando el fallback general `./index.html`.

Esto era una brecha real para la experiencia demo offline, no para la instalación inicial sin conexión. Una instalación PWA nueva requiere una primera carga online para registrar el Service Worker y descargar el shell.

## 2. Ruta, entrypoint y grafo ESM

| Elemento | Valor |
| --- | --- |
| Ruta real | `/modules/demo/demo-selector.html` |
| HTML | `modules/demo/demo-selector.html` |
| CSS | `modules/demo/demo-selector.css` |
| Entry point | `modules/demo/demo-selector-ui.js` |
| Módulos transitivos | `demo-selector-ui.js`, `demo-selector.js`, `demo-router.js`, `core/demo-identity-session.js`, `core/session.js`, `core/permissions.js`, `data/users.js` |
| Tamaño del grafo | 7 módulos |
| Imports faltantes / ciclos | Ninguno |

El HTML carga su CSS y el módulo `demo-selector-ui.js`. Este renderiza los tres perfiles desde `getDemoUsers()` y delega la selección a `selectDemoRoute()`.

## 3. Navegación e identidad

| Perfil | Identidad validada | Ruta elegida por `demo-router.js` |
| --- | --- | --- |
| Sofía Martínez Rojas | `STUDENT` | `../../index.html` |
| Carlos Pérez | `TEACHER` | `../professor/teacher-dashboard.html` |
| Administrador UBO | `ADMIN` | `../admin/admin-dashboard.html` |

La selección conserva solamente `{ id, role }` en `uboDemoIdentityV1` (`sessionStorage`) y memoria. La normalización requiere una coincidencia exacta del par con `data/users.js`; no se cambiaron IDs, roles ni credenciales.

Los guards existentes permanecen como frontera de autorización frontend:

- Student no puede abrir Admin.
- Teacher no puede abrir Admin.
- Sin identidad, Teacher/Admin redirigen al Selector.
- Logout limpia la identidad demo y vuelve al Selector; el acceso posterior a una ruta protegida es rechazado.

Las suites `demo-route-guards.test.js`, `demo-session-hardening.test.js` y `demo-logout-session-coordination.test.js` cubren los cambios Carlos → Admin → Student → Carlos, Sofía → Carlos → Admin → Sofía, el rechazo de rol y el logout sin estado residual.

## 4. Evidencia online de navegador

Se abrió `http://localhost:3000/modules/demo/demo-selector.html` en una pestaña de navegador nueva.

Resultado observado:

- URL final: `/modules/demo/demo-selector` (normalización del servidor), título `Selector demo · UBO Academic Hub`.
- El DOM renderizado contiene Sofía Martínez Rojas, Carlos Pérez y Administrador UBO, con sus botones de experiencia.
- Esto evidencia que `demo-selector-ui.js` se ejecutó: el contenedor `#demo-users` se entrega vacío en el HTML y se llena en runtime.

También se probaron accesos directos sin identidad a Teacher y Admin; ambos retornaron al Selector, conforme a los guards. El Panel Profesor previamente abierto, tras recarga, mostró la versión actual del shell y su enlace `Selector Demo`, evidencia de actualización respecto de la copia de caché anterior.

La automatización disponible no expone DevTools/Network/Console de Chrome, por lo que no se pueden adjuntar cabeceras, respuestas de red ni un log de consola desde esa herramienta. Este límite no ocultó errores: la evidencia funcional se complementó con pruebas Node deterministas y análisis estático del grafo.

## 5. Estado PWA anterior

`service-worker.js` usaba `ubo-academic-hub-v114` y precacheaba Profesor/Admin, pero omitía:

- Selector HTML;
- Selector CSS;
- entrypoint `demo-selector-ui.js`;
- `demo-selector.js`;
- `demo-router.js`;
- fallback documental de `/modules/demo/demo-selector.html`.

En consecuencia, ante fallo de red de la navegación documental del Selector se aplicaba `./index.html`, que no corresponde a esa ruta.

## 6. Decisión y cambios realizados

Se integró el Selector Demo al shell PWA porque forma parte del flujo funcional demo entre Student, Teacher y Admin.

### Assets agregados a `DEMO_SHELL_ASSETS`

| Categoría | Asset |
| --- | --- |
| HTML | `modules/demo/demo-selector.html` |
| CSS | `modules/demo/demo-selector.css` |
| JavaScript entrypoint | `modules/demo/demo-selector-ui.js` |
| Imports directos | `modules/demo/demo-selector.js`, `modules/demo/demo-router.js` |
| Imports transitivos existentes | `core/demo-identity-session.js`, `core/session.js`, `core/permissions.js`, `data/users.js` |

Los imports transitivos ya pertenecían al precache de los shells Profesor/Admin, por lo que no se duplicaron.

Se agregó el fallback:

```js
'/modules/demo/demo-selector.html': './modules/demo/demo-selector.html'
```

La versión de cache se cambió de `ubo-academic-hub-v114` a `ubo-academic-hub-v115`, porque el contenido precacheado cambió. La activación elimina los caches con nombre distinto y `clients.claim()` toma control de los clientes, de acuerdo con la estrategia existente. No se alteró el mecanismo de actualización/rollback.

## 7. Cobertura automática y regresión simulada

Se amplió de forma mínima `tests/pwa-esm-precache.test.js` con el shell `SELECTOR`.

La prueba verifica para Selector, Profesor y Admin:

- existencia de HTML, CSS y entrypoint;
- imports ESM locales, transitivos y faltantes;
- ciclos y duplicados de imports;
- presencia en la colección real de precache;
- fallback documental que devuelve el HTML correspondiente;
- consistencia de rutas;
- regresión conceptual: añade en memoria `modules/demo/future-selector-module.js` al grafo y confirma que la cobertura falla si no se incorpora al precache. No se crea ningún fixture permanente.

Resultado de la ejecución:

```text
SELECTOR_GRAPH_MODULES=7
SELECTOR_IMPORT_GRAPH_CYCLE_FREE
SELECTOR_GRAPH_OK
PWA_PRECACHE_REGRESSION_SIMULATION_OK
PWA_PRECACHE_COVERAGE_OK
```

La simulación de navegación offline queda cubierta de manera determinista por el mapa `OFFLINE_DOCUMENTS`: la URL `/modules/demo/demo-selector.html` resuelve al HTML real del Selector, no a `index.html`. Una prueba offline física después de instalar/actualizar la PWA requiere DevTools o control de red no disponible en esta automatización.

## 8. Tests e integridad

| Validación | Resultado |
| --- | --- |
| `tests/pwa-esm-precache.test.js` | Correcta, incluyendo Selector. |
| Suite UBO | 14 pruebas, 0 fallos. |
| `node --check` | 121 archivos JavaScript, 0 fallos. |
| Identity hardening | Correcto; corrupción, cambio de perfil y elevación de privilegio rechazados. |
| Guards | Correctos para Student, Teacher, Admin y ausencia de identidad. |
| Logout | Correcto para todos los roles y coordinado con sesión legacy. |
| Core `npm test` / `npm run check` | Correctos. |

No se modificó UniEcosystemCore. Sus únicos elementos locales no rastreados preexistentes continúan siendo documentación (`CORE_CONSUMER_CONTRACT.md` y `LOCAL_DEPENDENCY_DESIGN.md`).

## 9. Flags y aislamiento

Se mantienen inalterados:

```json
{
  "USE_CANONICAL_CAREER": false,
  "USE_CANONICAL_ROOM": false,
  "USE_CORE_SESSION": false
}
```

No se conectaron IdentitySnapshot, Identity Adapter, SessionPort ni Authorization Core al runtime. La aplicación Student y sus datos permanecen sin modificación funcional.

## 10. Riesgos y limitaciones

| Severidad | Riesgo | Estado |
| --- | --- | --- |
| LOW | La verificación física de Network/Console/offline requiere una sesión con DevTools o control de red. | Documentado; pruebas estáticas y automatizadas cubren el contrato. |
| LOW | La instalación inicial PWA no funciona sin una primera conexión. | Comportamiento normal de PWA; no es defecto. |

No quedan bloqueadores funcionales conocidos para el contrato Selector/PWA. La verificación manual de red puede realizarse como evidencia complementaria antes de una demostración institucional.

## 11. Resultado final

```text
SELECTOR_ONLINE_OK
STUDENT_FROM_SELECTOR_OK
TEACHER_FROM_SELECTOR_OK
ADMIN_FROM_SELECTOR_OK
SELECTOR_IDENTITY_OK
SELECTOR_GUARDS_OK
SELECTOR_LOGOUT_OK
SELECTOR_GRAPH_OK
SELECTOR_PRECACHE_OK
PWA_PRECACHE_COVERAGE_OK
IMPORT_GRAPH_CYCLE_FREE
NO_IMPORT_MISSING
CORE_UNMODIFIED
USE_CORE_SESSION=false
USE_CANONICAL_CAREER=false
USE_CANONICAL_ROOM=false
SELECTOR_PWA_INTEGRATION_OK
READY_FOR_CORE_IDENTITY_INTEGRATION
```

La preparación significa que puede planificarse la siguiente fase de integración reversible de identidad Core; no significa que Core haya sido activado en esta fase.
