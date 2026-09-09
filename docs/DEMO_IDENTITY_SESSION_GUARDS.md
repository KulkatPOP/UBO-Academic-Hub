# Frontera de identidad/sesión demo y guards de ruta

## Identidades demo

La frontera interna reconoce exclusivamente las identidades mínimas siguientes:

| Identidad | ID | Rol |
|---|---|---|
| Sofía Martínez Rojas | `student-sofia-martinez` | `STUDENT` |
| Carlos Pérez | `teacher-carlos-perez` | `TEACHER` |
| Administrador UBO | `admin-ubo` | `ADMIN` |

La identidad contiene solo `id` y `role`. No incluye contraseñas, tokens, información académica ni permisos duplicados.

## Resolución y sesión

`core/demo-identity-session.js` es la frontera única para las sesiones del entorno demo:

- `getCurrentDemoIdentity()` obtiene una identidad demo validada contra `data/users.js`.
- `setCurrentDemoIdentity()` acepta solamente un ID y rol que coincidan con un usuario demo existente.
- `clearCurrentDemoIdentity()` elimina la selección temporal y limpia el cache en memoria.

La selección explícita del selector demo se conserva en `sessionStorage` bajo `uboDemoIdentityV1`, únicamente para sobrevivir al salto entre el selector y los documentos Profesor/Admin. Es una sesión efímera por pestaña, no una credencial, no usa cookies y no persiste datos académicos.

## Relación con `uboSession`

La aplicación estudiante conserva sin cambios `uboSession` en `localStorage`. Cuando no existe una selección explícita de demo, la frontera puede derivar en lectura una identidad `STUDENT` a partir de una sesión legacy válida cuyo correo coincida con Sofía en `data/users.js`.

Esto mantiene el login `sofia.martinez` / `demo123` y sus datos actuales. No crea otra sesión legacy ni modifica el contenido de `uboSession`.

## Relación con `core/session.js`

`core/session.js` sigue siendo el cache en memoria del entorno demo. La nueva frontera lo hidrata desde la selección temporal y es la única capa que debe escribir la identidad demo. El selector dejó de invocar `setCurrentUser()` directamente.

Existen dos mecanismos por compatibilidad, no como dos sesiones equivalentes:

1. `uboSession`: sesión legacy exclusiva de la aplicación estudiante.
2. `uboDemoIdentityV1`: selección temporal exclusiva de Profesor/Admin y demos aisladas.

La frontera define la prioridad: una selección demo explícita es el contexto activo de los shells demo; en su ausencia se usa la adaptación read-only de `uboSession` para estudiante. Una futura migración deberá unificar ambos mediante un contrato de sesión, no copiando datos entre ellos.

## Guards

`core/demo-route-guard.js` evalúa el rol antes de que los renderizadores Profesor/Admin creen contenido. Los shells invocan `enforceDemoRouteGuard()` al cargar:

- Profesor requiere `TEACHER`.
- Administrativo requiere `ADMIN`.

No hay fallback permisivo. Una identidad ausente, inválida o de rol desconocido recibe `DENY`.

| Identidad actual | Ruta Profesor | Ruta Admin |
|---|---:|---:|
| STUDENT | Denegada → aplicación estudiante | Denegada → aplicación estudiante |
| TEACHER | Permitida | Denegada → Profesor |
| ADMIN | Denegada → Admin | Permitida |
| Sin identidad / desconocida | Denegada → selector demo | Denegada → selector demo |

La decisión se ejecuta al cargar la URL directa; no depende de que un botón esté oculto.

## UI y autorización

Los guards son **enforcement de ejecución en frontend**, superior a la mera visibilidad de UI. Sin embargo, una aplicación estática no puede constituir una frontera de seguridad de servidor: `sessionStorage` puede ser manipulado desde las herramientas del navegador. La autorización institucional real seguirá requiriendo backend y la integración futura, aún no realizada, con los contratos de UniEcosystemCore.

`core/permissions.js` no se modificó. Los guards aplican solo reglas mínimas por rol; los servicios de acciones conservan sus validaciones locales de permisos.

## Acceso directo y pruebas

La prueba [`tests/demo-route-guards.test.js`](../tests/demo-route-guards.test.js) cubre:

- Student permitido solo para Student y rechazado en Profesor/Admin.
- Teacher permitido en Profesor y rechazado en Admin.
- Admin permitido en Admin.
- Identidad ausente, rol desconocido y una identidad inválida: denegados.
- Determinismo de la misma identidad frente a la misma ruta.

La verificación PWA de Fase 1.45 detectó los tres módulos añadidos al grafo ESM. Por ello, y solo por esa evidencia, `service-worker.js` v113 incorpora los nuevos módulos al precache sin cambiar su versión.

## Core, Career, Room y PWA

- No se importó ni modificó UniEcosystemCore.
- No se conectaron IdentitySnapshot, SessionPort, AuthorizationContext ni Permission Policy del Core.
- `USE_CANONICAL_CAREER=false` y `USE_CANONICAL_ROOM=false` permanecen sin cambios.
- La cache PWA sigue siendo `ubo-academic-hub-v113`.

## Rollback

Archivos nuevos: `core/demo-identity-session.js`, `core/demo-route-guard.js`, `tests/demo-route-guards.test.js` y este documento.

Archivos modificados: `modules/demo/demo-selector.js`, `modules/professor/teacher-dashboard.js`, `modules/admin/admin-dashboard.js` y, por la cobertura demostrada, `service-worker.js`.

Para volver al comportamiento anterior se revierten solamente esos cambios y se retiran los tres assets nuevos del precache. No se tocan datos demo, credenciales, `uboSession`, cursos ni modelos.

## Próxima fase

Antes de conectar UniEcosystemCore, diseñar un contrato explícito de transición entre `uboSession` y la identidad demo, con una política de prioridad y cierre de sesión coordinado. La integración con Core debe mantenerse separada y reversible.
