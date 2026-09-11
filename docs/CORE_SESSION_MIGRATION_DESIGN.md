# Diseño de migración de Core Session sin activación

## Estado actual

Esta fase es de diseño. La aplicación UBO continúa siendo la autoridad de sesión, navegación y datos; UniEcosystemCore no se ejecuta en el runtime de sesión. El estado obligatorio es `USE_CORE_SESSION=false`, `USE_CORE_IDENTITY_CANARY=false`, `USE_CANONICAL_CAREER=false` y `USE_CANONICAL_ROOM=false`. La PWA se mantiene en `ubo-academic-hub-v116` y el Core de referencia es `414eee6392afa54e93adcc4f6c42d3be08d4387a`.

## uboSession

`app.js` crea y actualiza `localStorage.uboSession` mediante `saveStudent(data, username)`, con la forma `{ loggedIn: true, username, studentData }`. El login valida el usuario demo, llama a `saveStudent`, carga datos demo del perfil y abre Inicio. `session()` lee esa clave y la considera válida solo cuando existen `loggedIn`, `username` y `studentData`; una clave ausente, corrupta o incompleta devuelve `null` de forma controlada. `student()` y las pantallas autenticadas dependen indirectamente de ella; también se usa `username` para aislar algunas claves locales de cada perfil.

El logout actual primero llama `clearCurrentDemoIdentity()` y luego elimina `uboSession`. Un cambio de usuario sobreescribe la sesión legacy con el nuevo `username` y `studentData`; no existe expiración, backend ni token. Esta estructura lleva información académica/personal de demo y no es un contrato apto para Core.

## Demo Identity

`core/demo-identity-session.js` es una frontera local distinta de `uboSession`. Normaliza solamente `{ id, role }` contra `data/users.js`; para Teacher/Admin usa una selección explícita guardada en `sessionStorage` bajo `uboDemoIdentityV1` y memoria, mientras que para Student puede derivar una identidad por lectura de `uboSession.studentData.email` sin escribir la sesión legacy.

`clearCurrentDemoIdentity()` limpia `sessionStorage`, memoria y suprime el fallback legacy durante la navegación actual, evitando que un logout reconstruya una identidad. `setCurrentDemoIdentity()` reemplaza totalmente el perfil anterior. Los guards de Profesor/Admin consumen esta identidad local y UBO realiza cualquier redirección. Una SessionPort futura puede coexistir solo como espejo posterior a esta frontera, nunca como reemplazo de login, guard o router durante la coexistencia.

## SessionPort

El contrato existente del Core expone `getCurrentIdentity()`, `setCurrentIdentity(identity)` y `clear()`. `isSessionPort()` comprueba esos métodos y `assertSessionPort()` lanza `TypeError` si faltan. `InMemorySession` cumple el puerto, conserva una sola identidad privada en memoria y no tiene DOM, almacenamiento, persistencia, red, navegación ni datos UBO. `setCurrentIdentity()` delega la validación al snapshot y puede propagar sus errores; `clear()` deja el estado en `null`.

## IdentitySnapshot

`createIdentitySnapshot()` exige un objeto con `id` string no vacío y `roles` como arreglo de strings no vacíos. Devuelve un snapshot congelado. La equivalencia futura mínima para un perfil UBO de un rol es `{ id, role } → { id, roles: [role] }`. Extras como permisos, datos académicos, banderas de administrador o credenciales se ignoran y nunca se convierten en autoridad.

## Comparación

| Aspecto | UBO Session actual | Core Session actual | Decisión de diseño |
|---|---|---|---|
| Identidad | `username` + `studentData` o demo identity | `IdentitySnapshot` | Intercambiar solo `id` y rol normalizado. |
| Rol | Singular, validado contra usuarios demo | Arreglo `roles` | Un rol UBO equivale a un único claim Core. |
| Creación | Login UBO / selector demo | `setCurrentIdentity()` | UBO crea; Core solo observa después. |
| Lectura | `localStorage` y helpers UBO | Memoria | No sustituir la lectura legacy. |
| Actualización | Sobrescribe perfil legacy/demo | Sustituye el snapshot | Limpiar antes de escribir el perfil siguiente. |
| Logout | Limpia demo identity y `uboSession` | `clear()` | En futuro, limpiar ambos de manera explícita. |
| Expiración | No existe | No existe | Requiere decisión de backend, fuera de alcance. |
| Persistencia | `localStorage`; demo en `sessionStorage` | Ninguna | No adoptar Core como persistencia todavía. |
| Corrupción | `session()` retorna `null` | `TypeError` al snapshot inválido | Abort del espejo; jamás inventar identidad. |
| Ausencia | Login/onboarding | `null` | Denegación de guard UBO. |
| Autoridad | UBO | Ninguna en runtime | UBO permanece autoridad. |

## Contrato mínimo

El único contrato mínimo elegible es una identidad inmutable: `id` no vacío y un `role` demo/institucional validado, adaptado a `roles: [role]`. No se migran contraseñas, tokens, cookies, credenciales, permisos, notas, cursos, asistencia ni información académica. El adapter UBO sería el único punto que traduce el rol singular al snapshot Core.

## Student

Sofía Martínez Rojas debe conservar `uboSession` en legacy durante el primer tramo. Student usa login y `studentData` para Inicio, perfil y claves locales por usuario; migrarlo ahora mezclará identidad mínima con datos de pantalla y no aporta una ganancia verificable. Puede ser candidato posterior, tras autenticación real, persistencia segura y una fuente institucional de perfil. La recomendación presente es **B: quedarse temporalmente en legacy**, no una migración automática.

## Teacher

Carlos Pérez (`teacher-carlos-perez`, `TEACHER`) es el candidato menos invasivo para un futuro canario porque ya posee demo identity normalizada y guard aislado. Su canario solo podría espejar `{ id, role }` después de que el guard UBO permita la ruta; no debe activar SessionPort ahora ni alterar el dashboard, guard, selector, login o logout.

## Admin

Administrador UBO (`ADMIN`) queda fuera del primer canario. La superficie administrativa concentra más capacidades y el costo de confusión de rol es mayor. Debe esperar equivalencia Teacher demostrada, autorización institucional real y un contrato de privilegios separado de sesión.

## Login

Flujo futuro conceptual, sin implementación: `login UBO → validación UBO → identidad demo/institucional resuelta → adapter → snapshot observado por SessionPort → dashboard UBO`. Core no recibe usuario, contraseña, token ni controla formularios o redirecciones. Con el flag apagado se omite por completo el último tramo.

## Logout

El flujo esperado es `logout UBO → clearCurrentDemoIdentity → eliminar uboSession → clear del espejo Core → login UBO`. UBO debe limpiar primero su autoridad vigente. Si Core falla al limpiar, el evento se registra como fallo del espejo, se aborta cualquier modo de canario y se mantiene/desactiva el Core; no se reconstruye una identidad ni se borran datos académicos. Si UBO falla, no puede declararse logout exitoso: la futura integración debe fail-closed para su propia decisión y dejar un diagnóstico no sensible.

## Cambio de perfil

Para `Carlos → Admin → Carlos`, cada transición debe: resolver el nuevo perfil por UBO, limpiar completamente el snapshot anterior y, solo si el perfil está en alcance, escribir un snapshot nuevo. Nunca pueden coexistir `TEACHER + ADMIN` en una misma sesión o puerto. Si la limpieza del espejo falla, se aborta al modo legacy y se conserva la autoridad UBO sin combinar roles.

## Corrupción

| Caso | Tratamiento de diseño |
|---|---|
| Sesión inexistente | `null`; UBO muestra login o aplica su guard. |
| Sesión UBO inválida/corrupta | No derivar identidad; conservar tratamiento legacy controlado. |
| `id` o `role` inválido | No adaptar; Core no recibe snapshot. |
| `id`/rol incompatibles | Rechazar por normalización contra fuente demo/institucional. |
| Datos extra | Ignorarlos; no otorgan privilegios. |
| Estado residual | `clear()` del espejo y abort manual al legacy. |

## Failure modes

| Escenario | Modo coexistencia | Futuro canario |
|---|---|---|
| Core funciona | Solo observación, sin controlar UBO. | Comparar identidad exacta antes de seguir. |
| Core no responde o desaparece | UBO continúa; registrar diagnóstico no sensible. | Abort manual a legacy. |
| SessionPort lanza error | UBO no cambia. | Limpiar si es posible y abortar. |
| Snapshot inválido | No escribir Core. | Rechazar la operación. |
| Identity/role mismatch | UBO sigue siendo fuente. | Fail-closed para el flujo Core y abort. |
| Sesión UBO inválida | Login/guard UBO vigente. | No crear espejo. |
| Logout Core falla | Logout UBO sigue limpiando lo propio. | Marcar residual y abortar. |

**FALLBACK FUNCIONAL:** mientras haya coexistencia, el error del espejo Core no rompe el comportamiento legacy autorizado por UBO. **FALLBACK DE SEGURIDAD:** un flujo que requiera en el futuro autoridad Core no puede permitir acceso por un snapshot inválido, ausente, distinto o residual; debe denegar/abortar. El primero preserva la demo actual; el segundo evita escalamiento. Ninguno habilita autorización Core en esta fase.

## Seguridad

Los riesgos son session fixation (reusar identidad ajena), stale session, role confusion, privilege escalation por campos extras, identidad residual tras logout, doble sesión y almacenamiento duplicado. Las mitigaciones de diseño son: identidad mínima y normalizada; reemplazo total en profile switch; clear explícito; Core efímero; no copiar permisos; comparación exacta de id/rol; diagnósticos sin secretos; y rollback manual. Persistir credenciales o snapshots sin un backend autenticado aumentaría el riesgo y está prohibido por esta fase.

## Coexistencia

| Modo | Autoridad | Comportamiento |
|---|---|---|
| MODE 0 — Legacy | UBO | Estado actual: Core inactivo. |
| MODE 1 — Shadow | UBO | Core recibe solo observación de pruebas, sin efectos. |
| MODE 2 — Teacher canary | UBO inicialmente; Core solo contrato limitado aprobado | Futuro, explícito, reversible y solo Teacher. |
| MODE 3 — Migración gradual | Debe definirse por dominio y backend | Solo tras criterios de aprobación; no implementado. |

## Rollback

`Core Session ON → problema → USE_CORE_SESSION=false → recargar runtime → UBO vuelve a autoridad`. El rollback debe ser manual, reversible y no destructivo: limpiar el espejo Core si está disponible, no tocar `uboSession` salvo el flujo UBO normal, no perder identidad legacy y no borrar datos académicos. Se documentan motivo, perfil, resultado y verificación de ausencia residual.

## Persistencia

| Opción | Ventaja | Riesgo / límite |
|---|---|---|
| `localStorage` | Sobrevive a recargas. | Expuesto al contexto web; no apropiado para credenciales/tokens sin estrategia de seguridad. |
| `sessionStorage` | Aislado por pestaña/sesión. | Se pierde al cerrar y aún es cliente. |
| Memoria | Efímera y simple para espejo. | Se pierde al refrescar; no es sesión institucional. |
| Servidor | Revocación, expiración y auditoría reales. | Requiere backend, autenticación y contrato de seguridad. |

La SessionPort actual es solo memoria. No se debe añadir almacenamiento nuevo hasta decidir el contrato de servidor.

## PWA

No se modifica `service-worker.js` ni la cache `ubo-academic-hub-v116`. Una integración futura que agregue un adapter UBO cargado en runtime requerirá incorporarlo al grafo ESM/precache y validar actualización offline; los módulos de Core externos no se agregan automáticamente al precache de UBO.

## Browser

Para consumir SessionPort de Core en navegador se requeriría una distribución ESM estable, servidor Core disponible, CORS compatible, URLs versionadas, política de recarga y comportamiento offline definido. Un Core ausente, refresh, origen distinto o asset no precacheado no puede alterar login/guard UBO. El navegador no debe importar Core desde rutas de desarrollo en producción sin una estrategia de empaquetado/dependencia local aprobada.

## Arquitectura

La dirección obligatoria es **UBO → Adapter → Core**. El Core define contratos puros; no importa UBO, no toca DOM, router, login UI, `localStorage`, datos académicos ni pantallas. UBO conserva los puntos de integración, feature flags, UX, guards y rollback.

## Authorization

**Session != Authorization.** Un snapshot válido únicamente representa identidad mínima temporal; no concede permisos adicionales ni cambia guards. Authorization Core sigue inactiva, y cualquier política futura debe evaluarse separadamente con fail-closed y fuente institucional de permisos.

## Propuesta de migración

- **FASE A — Shadow:** comparación read-only de id/rol, métricas sin secretos y bandera apagada.
- **FASE B — Canary Teacher:** solo con aprobación explícita; espejo efímero posterior al guard UBO y abort manual.
- **FASE C — Validación:** comprobar login, reload, logout, cambio de perfil, acceso directo, corrupción, PWA y offline.
- **FASE D — Migración gradual:** decidir por rol/dominio tras backend y autorización reales; Student y Admin no se incluyen por defecto.
- **FASE E — Retiro de legacy:** únicamente cuando la sesión institucional tenga persistencia, revocación, auditoría y rollback probado.

## Riesgos

El principal riesgo es migrar antes de disponer de autenticación real, persistencia segura, expiración/revocación, backend y autorización institucional. También son riesgos el doble almacenamiento, snapshots obsoletos, dependencia de servidor Core en browser y falsa sensación de seguridad por roles demo.

## Beneficios

Un contrato mínimo desacoplado permitiría reutilizar el Core en otras aplicaciones, observar coherencia de identidad y evolucionar hacia un backend sin trasladar UI o datos académicos. Estos beneficios todavía no compensan el riesgo operativo de reemplazar `uboSession` en el prototipo actual.

## Criterios para detener

Detener/abortar cualquier futura activación ante mismatch de identidad o rol, sesión residual, fallo de puerto/adapter, guard o logout inconsistente, pérdida de acceso válido, acceso indebido, dependencia Core no disponible, cambio de PWA no validado o cualquier modificación de datos/autoridad fuera de alcance.

## Recomendación final

**NO MIGRAR SESSION TODAVÍA.** El diseño es viable como contrato y shadow controlado, pero no para activación: falta backend, autenticación institucional real, persistencia segura, expiración/revocación y una autorización independiente. Mantener todos los flags en `false`, Core detenido y UBO como única autoridad hasta que esos pre-requisitos estén aprobados.
