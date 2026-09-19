# Fase 2.45.1 — Diagnóstico de navegación Course Detail Teacher

Fecha: 2026-09-15
Entorno: Chrome estándar, frontend `http://localhost:3000`, API `http://localhost:3001`, PostgreSQL local.

## Resultado

**Defecto reproducido y corregido.** No fue una limitación exclusiva del navegador integrado.

## Reproducción y causa raíz

1. El dashboard docente LMS hidratado presentó Bases de Datos con el UUID LMS `7c6f443a-dc0e-4c3e-8e73-7b7d8717b219`, nombre Bases de Datos e identificador `INF-302`.
2. El enlace previo era `./teacher-course-detail.html?courseId=<UUID>`.
3. El servidor local `serve` respondió `301` para esa ruta `.html` con `Location: /modules/professor/teacher-course-detail`, eliminando el query string.
4. `selectedCourseId()` no recibió `courseId`, recurrió a `getCourses()[0]` y el detalle DEMO fue renderizado.

Por tanto, el ID no se perdía en el objeto de curso, `dataset`, servicios ni API: se perdía en la redirección HTTP del servidor estático antes de cargar el módulo de detalle.

## Corrección mínima

- `modules/professor/teacher-dashboard.js`: los enlaces de detalle ahora usan `teacher-course-detail.html#courseId=<id>`.
- `modules/professor/teacher-course-detail.js`: acepta primero el contrato previo `?courseId=<id>` y luego el nuevo fragmento `#courseId=<id>`.
- `modules/professor/teacher-dashboard.html` y `modules/professor/teacher-course-detail.html`: se versionaron los módulos de entrada como `?v=2` para evitar que un Service Worker anterior reutilice JavaScript precacheado.
- `service-worker.js`: cache incrementado a `ubo-academic-hub-v187`, con los dos módulos versionados en precache.

El fragmento no se envía al servidor, por lo que sobrevive la normalización de `.html` a la ruta sin extensión. Mantener `.html` conserva además la ruta documentada para hosts estáticos y el fallback documental offline existente.

## Validación en navegador estándar

Ruta exacta comprobada:

`/modules/professor/teacher-course-detail.html#courseId=7c6f443a-dc0e-4c3e-8e73-7b7d8717b219`

Tras la redirección del servidor, Chrome conservó:

`/modules/professor/teacher-course-detail#courseId=7c6f443a-dc0e-4c3e-8e73-7b7d8717b219`

El detalle LMS mostró correctamente:

- Bases de Datos / INF-302.
- Un estudiante LMS: Sofía Martínez (`STUDENT`).
- Tres materiales LMS.
- Cero evaluaciones LMS, sin crear datos ficticios.
- Un registro de asistencia LMS.
- Analítica LMS etiquetada sin métricas inventadas.

La misma navegación por fragmento funcionó para Programación y, al volver a Bases de Datos, restauró nuevamente el detalle LMS correcto. No hubo errores o warnings de consola durante la carga del detalle.

## API y autorización

Con una sesión docente temporal:

| Consulta | Resultado |
|---|---|
| `GET /api/courses` | Bases de Datos disponible para el docente autenticado. |
| `GET /api/courses/:courseId` | 200; nombre Bases de Datos, código INF-302. |
| `GET /api/courses/:courseId/students` | 200; un estudiante público. |
| `GET /api/analytics/teacher/courses/:courseId` | 200. |
| Curso privado ajeno | 404; no expone información. |

La corrección no transmite `userId`, `teacherId` ni `role` por URL y no modifica la autorización del backend.

## Limitaciones de automatización

Los clics automatizados sobre los enlaces ancla en la extensión Chrome permanecieron en el dashboard, aun con un `href` válido, sin errores de consola. Como el objetivo de la fase exige no declarar éxito por inferencia, el clic end-to-end instrumentado queda **NOT_TESTED**. La ruta corregida fue comprobada directamente en Chrome y carga el detalle LMS con el ID preservado.

La regresión visual Student no se ejecutó en esta fase porque no se autorizó una nueva autenticación Student; la suite frontend conserva cobertura de Student y no se modificó código Student.

## Estados

`COURSE_ID_PRESERVED`
`COURSE_DETAIL_LMS_OK`
`TEACHER_AUTHORIZATION_OK`
`CORE_UNMODIFIED`

`TEACHER_COURSE_NAVIGATION_NOT_TESTED` — clic automatizado no ejecutó la navegación pese a un enlace correcto.
`STUDENT_REGRESSION_NOT_TESTED` — no se abrió una sesión Student en esta fase.

## Próximo paso

Repetir un clic físico/manual de usuario en Chrome si se requiere cerrar explícitamente `TEACHER_COURSE_NAVIGATION_OK`. No se recomienda cambiar de nuevo el código sin una reproducción humana distinta de la limitación observada en la automatización.
