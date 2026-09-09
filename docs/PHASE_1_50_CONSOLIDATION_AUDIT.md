# Fase 1.50 — Auditoría de consolidación y checkpoint de seguridad

## A. Objetivo

Determinar, con evidencia reproducible, si UBO Academic Hub permanece estable, reversible y preparado para un próximo checkpoint antes de cualquier integración adicional con UniEcosystemCore. Esta fase no agrega funcionalidades ni conecta los contratos de identidad, sesión o autorización del Core.

## B. Estado previo

La aplicación estudiante usa la sesión legacy `uboSession` en `localStorage`. Profesor y Admin usan una identidad demo mínima en `sessionStorage` bajo `uboDemoIdentityV1`, con exactamente `{ id, role }`. Los guards de ruta se ejecutan solo en los shells demo de Profesor/Admin.

El cache activo previsto es `ubo-academic-hub-v114`. Los flags `USE_CANONICAL_CAREER` y `USE_CANONICAL_ROOM` permanecen en `false`.

## C. Student

La prueba local en navegador verificó el onboarding/login, el rechazo del formulario incompleto, el acceso de `sofia.martinez`, el dashboard de Sofía y su carrera `Ingeniería Informática`. El logout existente vuelve al login y ahora invoca `clearCurrentDemoIdentity()` antes de eliminar `uboSession`.

No se modificaron credenciales ni datos académicos. La prueba de identidad cubre también la sesión inexistente y el comportamiento frente a almacenamiento demo corrupto.

## D. Teacher

`Carlos Pérez` se normaliza únicamente como `TEACHER`. El Selector Demo abrió correctamente el Panel Profesor, que mostró el resumen, cursos y detalle enlazado. Sin identidad, la URL directa redirigió al Selector Demo antes de renderizar contenido protegido. El botón de logout eliminó la identidad y reemplazó la ruta por el Selector Demo.

## E. Admin

`Administrador UBO` se normaliza únicamente como `ADMIN`. El Selector Demo abrió correctamente el Panel Administrativo con perfil, resumen, gestión y estadísticas. Sin identidad, la URL directa redirigió al Selector Demo antes de renderizar contenido protegido. El logout volvió al Selector Demo.

## F. Cambio de perfil

Se verificaron las seis transiciones: `STUDENT → TEACHER`, `STUDENT → ADMIN`, `TEACHER → STUDENT`, `TEACHER → ADMIN`, `ADMIN → STUDENT` y `ADMIN → TEACHER`.

En cada caso, `setCurrentDemoIdentity()` normaliza contra `data/users.js`, sustituye el valor previo y persiste exclusivamente `{ id, role }`. No se conservan propiedades, permisos ni roles de la identidad anterior.

## G. Logout

`clearCurrentDemoIdentity()` es el único cierre demo. Elimina la clave de `sessionStorage`, limpia `core/session.js`, es seguro sin sesión y devuelve `null`. La prueba cubre Student, Teacher y Admin; después del cierre, los guards de Teacher/Admin deniegan acceso.

El logout Student conserva el contrato legacy: elimina `uboSession` y navega al login. No sustituye ni migra dicho contrato.

## H. Stale session

Se validaron memoria, `sessionStorage`, recarga de una identidad válida, logout posterior, datos corruptos, valores parciales, IDs desconocidos, roles desconocidos y pares ID/rol incoherentes. Los valores inválidos se deniegan. Tras logout, el fallback legacy queda suprimido durante el ciclo actual para impedir que una identidad demo eliminada reaparezca desde memoria o adaptación.

## I. No privilege escalation

Pares como Sofía + `ADMIN`, Carlos + `ADMIN` y Administrador + `TEACHER` se rechazan. Propiedades extra como `isAdmin` o `permissions: ["*"]` se descartan; no aumentan privilegios.

## J. `uboSession` versus demo identity

| Contexto | Fuente | Prioridad y resultado |
| --- | --- | --- |
| Aplicación estudiante | `uboSession` | Controla el login legacy y sus pantallas. |
| Selección demo explícita | `uboDemoIdentityV1` | Tiene prioridad en los shells demo. |
| Sin selección demo y `uboSession` válida de Sofía | Adaptación de lectura | Puede resolver una identidad `STUDENT` solo para compatibilidad. |
| Teacher/Admin sin identidad válida | Guard | Deny y redirección segura. |

Riesgo conocido y controlado: una `uboSession` legacy válida no contiene rol; la adaptación solo reconoce la identidad demo de Sofía mediante su correo. No concede acceso Teacher/Admin. Esta coexistencia es temporal y no debe confundirse con autenticación institucional.

## K. Route guards

Los guards permiten solamente el rol exacto: Teacher para Profesor y Admin para Administración. Student, identidad inexistente, corrupta o incompatible se deniegan. Los redirects son controles de navegación frontend y no una medida de seguridad de backend.

Cuando existe una sesión legacy válida de Sofía pero no una selección demo, el acceso a Teacher/Admin se deniega; el shell puede redirigir a la aplicación estudiante por su configuración de compatibilidad. Sin sesión, redirige al Selector Demo.

## L. No flash de contenido protegido

Auditoría estática y navegador: los shells inicialmente no contienen datos protegidos renderizados, y `enforceDemoRouteGuard()` se evalúa antes de invocar los renderizadores. Las rutas directas sin identidad mostraron el Selector Demo, sin contenido de Carlos ni del Administrador visible.

## M. PWA v114

`service-worker.js` declara `ubo-academic-hub-v114` y precachea `app.js?v=113`, la aplicación principal, los shells Profesor/Admin y su grafo de módulos. No se cambió la versión durante esta auditoría.

## N. ESM y precache

`tests/pwa-esm-precache.test.js` pasó con:

- `PROFESSOR_GRAPH_OK` (16 módulos);
- `ADMIN_GRAPH_OK` (17 módulos);
- `PWA_PRECACHE_COVERAGE_OK`;
- sin ciclos ni imports locales faltantes.

## O. Career

`USE_CANONICAL_CAREER=false`. Sofía mantiene `Ingeniería Informática` por el camino legacy. No se tocó el adapter, bridge, mappings ni datos de carrera.

## P. Room

`USE_CANONICAL_ROOM=false`. No se activó ni modificó el adapter, bridge, mappings o datos de salas.

## Q. Core

UniEcosystemCore no fue modificado por esta fase. El último commit observado es `414eee6 docs(core): complete productization and github readiness`; sus comandos `npm test` y `npm run check` pasaron.

Su `git status` conserva dos documentos no rastreados preexistentes: `docs/CORE_CONSUMER_CONTRACT.md` y `docs/LOCAL_DEPENDENCY_DESIGN.md`. No pertenecen a esta auditoría y requieren una decisión explícita dentro del repositorio Core antes de un checkpoint propio de Core.

## R. Aislamiento

No se detectó dependencia inversa Core → UBO. UBO mantiene imports directos existentes hacia Core únicamente en los adapters institucionales Career/Room. La Fase 1.50 no añadió imports ejecutables a `IdentityPort`, `SessionPort`, `AuthorizationContext` ni `Permission Policy`.

## S. Tests

- `node --check` para todos los JavaScript UBO: correcto.
- Suite UBO completa: correcta.
- Identity, guards, hardening y logout: correctos.
- Transiciones de los seis perfiles, stale session y no escalation: correctos.
- Career/Room config test: correcto.
- PWA/ESM precache test: correcto.
- Core `npm test` y `npm run check`: correctos.
- Navegador local: Student, Teacher y Admin verificados; no se observó error visible.

## T. Git

No se realizó commit, push, deploy ni operación destructiva de Git. `git diff --check` no reportó errores de whitespace; Git emitió solamente avisos informativos de conversión LF/CRLF.

El árbol UBO conserva cambios acumulados de fases anteriores y archivos no rastreados de adapters, tests y documentación. Esta fase agrega solamente este documento.

## U. Riesgos

1. Los guards son frontend y no reemplazan autorización de servidor.
2. `uboSession` y la identidad demo siguen siendo contratos separados; la adaptación Student es de compatibilidad temporal.
3. El Core tiene documentación no rastreada preexistente, por lo que su checkpoint debe decidirse por separado.
4. Los datos y credenciales son demo; no existe autenticación real, backend, token ni control de acceso del servidor.

## V. Limitaciones

No se integraron `IdentityPort`, `SessionPort`, `AuthorizationContext` ni la política del Core con rutas reales. Tampoco se activaron Career o Room, ni se validó autorización en un backend porque no existe en esta fase.

## W. CHECKPOINT_READINESS

**READY para un checkpoint de UBO Academic Hub.**

El checkpoint debería incluir los cambios acumulados desde las fases anteriores: frontera demo de identidad/guards/logout, shells Profesor/Admin, PWA v114, adapters read-only, tests y documentación asociada. Debe excluir archivos temporales, secretos y cualquier archivo no revisado. El Core debe permanecer fuera de este checkpoint UBO; sus dos documentos no rastreados requieren tratamiento explícito en su propio repositorio.

## X. Recomendación Fase 1.51

Antes de integrar UniEcosystemCore, definir y aprobar un contrato explícito de transición para identidad y sesión. La siguiente fase debe ser de diseño/auditoría read-only: establecer criterios para reemplazar la adaptación legacy Student sin conectar todavía los ports del Core a login o rutas reales.
