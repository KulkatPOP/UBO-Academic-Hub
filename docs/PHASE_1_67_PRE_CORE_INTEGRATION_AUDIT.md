# Fase 1.67 — Auditoría integral previa a integración de Core

**Fecha:** 2026-09-09
**Alcance:** diagnóstico y documentación. No se activó UniEcosystemCore en runtime, no se cambiaron banderas, sesiones, rutas ni interfaces funcionales.

## Resultado ejecutivo

**Estado:** `PRE_CORE_INTEGRATION_AUDIT_WARNINGS`
**Decisión:** `CORE_IDENTITY_INTEGRATION_NOT_READY`

La frontera de identidad, las validaciones automáticas y el aislamiento de Core son correctos para continuar en modo de diseño/sombra. Sin embargo, aún no está demostrado de forma forense que el Selector Demo y sus transiciones se hidraten de manera consistente bajo el shell/PWA real. Esa evidencia es obligatoria antes de activar una primera integración de identidad de Core, incluso reversible.

## A. Estado Git y alcance de cambios

| Área | Resultado |
| --- | --- |
| Rama UBO | `main` |
| Último commit UBO | `ca238a9 chore(ubo): establish pre-core-integration checkpoint` |
| Árbol UBO | No limpio: cambios y documentación de fases previas sin confirmar; no se modificaron durante esta auditoría salvo este informe. |
| `git diff --check` UBO | Correcto; Git informó solamente conversiones LF → CRLF previstas en archivos ya modificados. |
| Core | `414eee6 docs(core): complete productization and github readiness` |
| Árbol Core | Sin diffs rastreados; contiene dos documentos locales no rastreados preexistentes: `docs/CORE_CONSUMER_CONTRACT.md` y `docs/LOCAL_DEPENDENCY_DESIGN.md`. |

La ausencia de un árbol limpio es una advertencia de trazabilidad, no un defecto funcional. Antes de activar un canario debe existir un checkpoint deliberado de los cambios locales aprobados.

## B. Identidad, sesión y accesos

### Fuentes de identidad

| Contexto | Fuente vigente | Persistencia | Observación |
| --- | --- | --- | --- |
| Aplicación estudiante | `uboSession` en `localStorage` | Legacy | `app.js` sigue siendo la fuente de sesión estudiantil. |
| Profesor/Admin demo | `uboDemoIdentityV1` en `sessionStorage` + `core/session.js` en memoria | Temporal | `core/demo-identity-session.js` valida el par exacto `id` + `role` contra `data/users.js`. |
| Fallback estudiante | Adaptación de lectura de `uboSession` | Sin escritura adicional | Solo deriva una identidad STUDENT válida por correo; no crea sesión legacy ni persiste credenciales. |
| Core | No conectado en runtime | N/A | Los adapters Core se usan en pruebas/sombra, no desde `app.js` ni shells en producción. |

`normalizeDemoIdentity()` reduce cualquier candidato a `{ id, role }` únicamente si el par coincide exactamente con un usuario demo conocido. Esto evita que atributos arbitrarios, un rol cambiado o una identidad corrupta concedan privilegios.

### Matriz de acceso revisada

| Identidad | Ruta Student | Ruta Teacher | Ruta Admin | Resultado esperado |
| --- | --- | --- | --- | --- |
| STUDENT válida | Permitida | Redirige a Student | Redirige a Student | Sin escalamiento |
| TEACHER válida | Redirige a Teacher | Permitida | Redirige a Teacher | Sin escalamiento |
| ADMIN válida | Redirige a Admin | Redirige a Admin | Permitida | Sin escalamiento |
| Sin identidad | Aplicación/login legacy | Selector Demo | Selector Demo | Ruta protegida denegada |
| Identidad inválida/corrupta | No concede acceso | Selector Demo | Selector Demo | Denegada |

El guard `core/demo-route-guard.js` normaliza antes de comparar rol y emplea `window.location.replace`, por lo que no conserva una ruta protegida en el historial tras una denegación.

### Login, logout y cambio de perfil

Se confirmaron por pruebas automatizadas:

- Login/identidad demo válida, corrupción de `sessionStorage` y roles incompatibles son deterministas.
- Cambiar perfil reemplaza, en lugar de acumular, la identidad anterior.
- `clearCurrentDemoIdentity()` elimina `uboDemoIdentityV1`, limpia la sesión en memoria y suprime el fallback legacy durante el ciclo posterior al logout.
- El logout legacy de `app.js` invoca `clearCurrentDemoIdentity()` antes de eliminar `uboSession`.
- No se detectó elevación de privilegio por modificar el rol o añadir propiedades a la identidad serializada.

## C. Profesor, Admin y estudiante

| Superficie | Estado estático/automatizado | Riesgo relevante |
| --- | --- | --- |
| Estudiante | Login y sesión legacy permanecen aislados de Core. | El comportamiento visual es el baseline legado; no se ha migrado identidad. |
| Profesor | Guard de rol, logout y enlace al Selector Demo presentes. El detalle de curso conserva asistencia, notas y materiales. | La hidratación real del shell depende de la evidencia PWA pendiente. |
| Admin | Guard de rol, logout y enlace al Selector Demo presentes; el dashboard usa sus servicios ya migrados. | La hidratación real del shell depende de la evidencia PWA pendiente. |
| Selector Demo | Rutas estáticas correctas: `modules/demo/demo-selector.html` → Teacher/Admin según rol. | No está precacheado ni tiene fallback documental propio. |

## D. PWA, ESM y shells

La validación `tests/pwa-esm-precache.test.js` pasó. El grafo ESM de Profesor contiene 16 módulos y el de Admin 17 módulos; ambos están libres de ciclos y sus assets directos requeridos están precacheados.

No obstante, `service-worker.js` (`DEMO_SHELL_ASSETS` y `OFFLINE_DOCUMENTS`) incluye shells Profesor/Admin, pero **no incluye** `modules/demo/demo-selector.html`, `demo-selector-ui.js` ni `demo-selector.js`. Ante un fallo de red de documento, el fallback general termina en `./index.html` cuando no hay entrada específica. Esta es la causa estática conocida que puede explicar una navegación a raíz en condiciones offline o de shell desactualizado.

Los informes previos `docs/DEMO_HYDRATION_ROOT_CAUSE_AUDIT.md` y `docs/DEMO_HYDRATION_DEVTOOLS_FORENSIC_AUDIT.md` mantienen el diagnóstico de hidratación como no resuelto: las herramientas disponibles no permitieron inspeccionar Network/Console/Service Worker del navegador para confirmar la respuesta realmente recibida. No se debe inferir una integración Core correcta a partir de esa evidencia incompleta.

## E. Adapters, mappings y modo sombra

| Elemento | Estado | Uso runtime |
| --- | --- | --- |
| Career/Room adapters y mappings | Contratos y pruebas disponibles. | Read-only; no sustituye fuentes legacy. |
| `core-identity-adapter.js` | Convierte identidad UBO a snapshot de Core. | Solo pruebas y modo sombra; sin consumidor runtime. |
| Session shadow/coexistence/canary | Diseños, checklist y pruebas disponibles. | Banderas desactivadas; no se ejecutó canario. |
| Authorization | Policy/guard UBO sigue aislado de Core. | No hay delegación de permisos a Core. |

La configuración institucional conserva `USE_CORE_SESSION: false`. No se detectaron imports de Core desde `app.js`, los shells de Profesor/Admin ni el flujo de login. Las referencias a `UniEcosystemCore` se concentran en adapters read-only y pruebas.

## F. Validación técnica ejecutada

| Comprobación | Resultado |
| --- | --- |
| Suite UBO | 14 archivos de prueba, 0 fallos. |
| Sintaxis UBO | 121 archivos JavaScript, 0 fallos con `node --check`. |
| Prueba PWA/ESM | Correcta: grafos Profesor/Admin sin ciclos y cobertura declarada correcta. |
| Core `npm test` | Correcto. |
| Core `npm run check` | Correcto. |
| `git diff --check` UBO | Correcto. |

La observación de navegador queda limitada a lo documentado en las auditorías de hidratación: la app Student y el detalle Profesor fueron visibles; las rutas protegidas redirigen coherentemente cuando la identidad no coincide. No existe evidencia DevTools/Network suficiente para declarar sanas todas las transiciones de Selector Demo bajo PWA.

## G. Hallazgos y severidad

| Severidad | Hallazgo | Impacto | Acción previa requerida |
| --- | --- | --- | --- |
| **HIGH** | Hidratación/carga real del Selector Demo bajo PWA no resuelta forensemente. | Una activación de Core Identity podría ocultar o confundir fallas de navegación existentes. | Obtener evidencia de Network, Console y Service Worker del navegador sobre `demo-selector.html` y cada transición. |
| **MEDIUM** | Selector Demo no participa en `DEMO_SHELL_ASSETS` ni en `OFFLINE_DOCUMENTS`. | Riesgo de fallback a `index.html` sin red o con caché inconsistente. | Decidir y validar explícitamente su estrategia PWA antes de canario. |
| **MEDIUM** | Árbol UBO no está limpio antes de la próxima activación. | Menor trazabilidad y rollback menos preciso. | Revisar/aprobar los cambios acumulados y crear un checkpoint cuando se autorice. |
| **LOW** | Core contiene dos documentos locales no rastreados. | No afecta runtime, pero requiere decisión de propiedad/versionado. | Clasificarlos o excluirlos antes de un release de Core. |

No se detectaron hallazgos CRITICAL en el contrato de identidad, guard de rutas, logout ni pruebas automatizadas.

## H. Decisión de preparación

**No iniciar todavía `READY_FOR_CORE_IDENTITY_INTEGRATION`.**

Se puede continuar con diseño, pruebas unitarias y modo sombra. Para habilitar el primer canario reversible de identidad Core deben completarse, en orden:

1. Resolver o demostrar con DevTools la hidratación de Selector/Teacher/Admin y la fuente de cada respuesta de red/caché.
2. Definir y probar la cobertura PWA del Selector Demo, incluido el caso offline y actualización de cache.
3. Establecer un checkpoint Git de los cambios locales autorizados para que el rollback sea inequívoco.
4. Ejecutar el canario Teacher ya diseñado, con `USE_CORE_SESSION` aún controlado y sin modificar la sesión Student legacy.

## I. Garantías de esta fase

- No se modificaron `app.js`, login, navegación legacy, datos demo, Core ni banderas de activación.
- No se realizó commit, push ni deploy.
- Este archivo es el único artefacto creado por la auditoría Fase 1.67.
