# QA integral Teacher post-sesión persistente — Fase 2.44

Fecha: 2026-09-15
Alcance: regresión Teacher posterior a las sesiones persistentes PostgreSQL. No se modificaron Core, notas oficiales, asistencia oficial, matrícula ni fuentes LMS.

## Resumen

La matriz HTTP se ejecutó contra PostgreSQL activo usando una sesión autenticada de Teacher, creada y revocada durante la prueba. La cookie no se registró ni se expuso. La misma sesión sobrevivió a un reinicio controlado de Express y conservó el ámbito Teacher.

| Área | Resultado | Evidencia |
|---|---|---|
| Login / cookie | OK | Login 200; cookie con `HttpOnly` y `SameSite=Lax`. |
| Sesión y reinicio Express | OK | `/api/users/me`, `/api/courses` y analítica Teacher devolvieron 200 antes y después del reinicio. |
| Perfil efectivo | OK | `/api/users/me` informó rol `TEACHER`. |
| Cursos | OK | Se recibieron exactamente Bases de Datos, Programación y Álgebra. |
| Detalle del curso | OK | Bases de Datos respondió 200. |
| Estudiantes | OK | `/api/courses/:courseId/students` respondió 200; los registros contenían sólo `id`, `name` y `role`. |
| Materiales, evaluaciones y asistencia | OK | Las lecturas autorizadas respondieron 200. |
| Analítica Teacher | OK | Overview y detalle de curso respondieron 200 desde el contrato LMS. |
| Mensajes y notificaciones | OK | Listado y contador de notificaciones respondieron 200 dentro de la sesión Teacher. |
| Inteligencia / progreso Student | OK, bloqueados | Ambos endpoints respondieron 403 aun con parámetros y cabeceras falsificadas. |
| Recomendaciones Student / Tutor | OK, bloqueados | Recomendaciones inteligentes y Tutor respondieron 403 para Teacher. |
| Endpoint Admin | OK, bloqueado | `/api/analytics/admin/overview` respondió 403 aunque se enviaron parámetros o rol falsificados. |
| Spoofing de identidad/rol | OK | La cookie prevaleció; los parámetros y encabezados falsos no cambiaron los tres cursos autorizados. |
| Curso inexistente | OK | Respondió 404. |
| Curso real de otro Teacher | NOT_TESTED | No existe fixture real disponible y no se creó uno artificial. |
| Logout / reutilización | OK | Logout 204 y siguiente lectura privada 401. |
| PWA | OK por revisión y pruebas | El precache contiene recursos estáticos; no almacena respuestas privadas `/api/*`. |
| Consola | NOT_TESTED para Teacher | No se realizó login de credencial mediante UI en el perfil del navegador. |

## HTTP real verificado

```text
login → 200
/api/users/me → 200
/api/courses → 200
/api/analytics/teacher/courses → 200
reinicio de Express
/api/users/me → 200
/api/courses → 200
/api/courses/:courseId → 200
/api/courses/:courseId/students → 200
/api/courses/:courseId/materials → 200
/api/evaluations → 200
/api/attendance/course/:courseId → 200
/api/analytics/teacher/courses/:courseId → 200
/api/messages → 200
/api/notifications → 200
/api/intelligence/student → 403
/api/progress/student → 403
/api/recommendations/intelligent → 403
/api/tutor/ask → 403
/api/analytics/admin/overview → 403
logout → 204
lectura privada post-logout → 401
```

## Seguridad y privacidad

- No se devolvieron contraseñas, cookies, tokens, hashes, credenciales, sesiones, mensajes privados de Student ni notificaciones privadas en las respuestas inspeccionadas.
- Los parámetros `userId`, `studentId`, `teacherId` y `role`, junto con `x-user-id` y `x-role`, no tuvieron autoridad frente a la identidad de cookie.
- Teacher no accedió a inteligencia, progreso, recomendaciones ni Tutor de Student.
- La UI existente debe conservar el contrato de fallback: 401 y 403 no se sustituyen por datos DEMO.

## Validaciones técnicas

- Suite frontend: 111 pruebas correctas.
- Suite backend: 51 pruebas correctas.
- `node --check`: 299 JavaScript comprobados en el proyecto, sin errores de sintaxis.
- `npm test` y `npm run check` de UniEcosystemCore: correctos.
- `git diff --check`: correcto; sólo se mostraron avisos CRLF de cambios previos.
- Core: sin modificaciones de esta fase.

## Limitaciones

No se ingresaron credenciales mediante la UI del navegador durante la auditoría. Por ello quedan `NOT_TESTED` la restauración visual de una sesión Teacher en perfil limpio, logout visual, responsive 390/768/1920, claro/oscuro y accesibilidad interactiva. La evidencia API y las suites automatizadas no deben presentarse como sustituto de esas comprobaciones manuales.

## Estado de criterios

`TEACHER_SESSION_OK`, `TEACHER_SESSION_RESTART_OK`, `TEACHER_COURSES_OK`, `TEACHER_COURSE_DETAIL_OK`, `TEACHER_STUDENTS_OK`, `TEACHER_MATERIALS_OK`, `TEACHER_EVALUATIONS_OK`, `TEACHER_ATTENDANCE_OK`, `TEACHER_ANALYTICS_OK`, `STUDENT_ENDPOINTS_BLOCKED`, `STUDENT_INTELLIGENCE_BLOCKED`, `STUDENT_PROGRESS_BLOCKED`, `STUDENT_RECOMMENDATIONS_BLOCKED`, `ADMIN_ENDPOINT_BLOCKED`, `USER_SPOOFING_BLOCKED`, `ROLE_SPOOFING_BLOCKED`, `COURSE_ISOLATION_OK`, `LOGOUT_OK`, `POST_LOGOUT_BLOCKED`, `NETWORK_OK`, `PWA_PRIVATE_DATA_SAFE`, `CORE_UNMODIFIED` están comprobados.

`TEACHER_LOGIN_OK` y `TEACHER_SESSION_RESTORE_OK` por UI, `TEACHER_DASHBOARD_OK` por UI, `LIGHT_MODE_OK`, `DARK_MODE_OK`, `RESPONSIVE_OK`, `ACCESSIBILITY_OK`, `NO_LOCAL_TOKEN_OK` por inspección de navegador, y acceso a curso de otro docente quedan `NOT_TESTED`.
