# Diseño de API futura

Prefijos: `/api` para recursos propios de Hub y `/integration` para adaptadores hacia el sistema institucional. Todas las respuestas deben usar JSON, validación de esquema y errores con códigos estables. La autorización se verifica en servidor para cada recurso; los roles enviados por cliente no son autoridad.

## Autenticación y perfiles

| Método/ruta | Uso |
|---|---|
| `POST /api/auth/login` | Autentica credenciales y crea sesión/token seguro |
| `POST /api/auth/logout` | Revoca sesión actual |
| `POST /api/auth/refresh` | Renueva token cuando se aplique refresh token |
| `GET /api/users/me` | Perfil del usuario autenticado y permisos efectivos |
| `PATCH /api/users/me/preferences` | Preferencias no académicas opcionales |

## Integración académica institucional (lectura)

| Método/ruta | Acceso esperado |
|---|---|
| `GET /integration/student/profile` | estudiante autenticado; perfil académico mínimo |
| `GET /integration/student/courses` | estudiante autenticado; cursos y matrícula oficiales |
| `GET /integration/student/performance` | estudiante, profesor relacionado o admin autorizado; señales necesarias para analítica |
| `GET /integration/courses/:id` | metadatos oficiales mínimos de un curso relacionado |

## LMS propio de Hub

| Método/ruta | Acceso esperado |
|---|---|
| `GET/POST /api/lms/courses/:contextId/materials` | lectura por relación institucional; escritura según rol LMS |
| `GET/POST /api/lms/courses/:contextId/announcements` | lectura por relación institucional; escritura profesor/autorizado LMS |
| `GET /api/lms/evaluations` / `POST /api/lms/evaluations` | evaluaciones propias de Hub, filtradas por contexto y rol |
| `GET /api/lms/evaluations/:id` | acceso relacionado al contexto LMS |
| `POST /api/lms/evaluations/:id/submissions` | estudiante relacionado; una entrega por evaluación LMS |
| `PATCH /api/lms/submissions/:id/grade` | calificación LMS propia, nunca acta oficial |
| `GET/POST /api/lms/courses/:contextId/attendance-sessions` | QR/actividad LMS propia; no sustituye asistencia oficial |
| `POST /api/lms/attendance-sessions/:id/records` | sujeto a relación institucional y reglas LMS |

## Mensajes, IA y analítica

| Método/ruta | Uso |
|---|---|
| `GET /api/messages` / `POST /api/messages` | bandeja filtrada y envío autorizado por curso |
| `PATCH /api/messages/:id/read` | sólo destinatario |
| `GET /api/tutor/context` | contexto del estudiante autenticado |
| `POST /api/tutor/question` | consulta tutor, con límites de contenido y tasa |
| `GET /api/knowledge/search?courseId=&q=` | recuperación RAG autorizada |
| `GET /api/students/:id/risk` | riesgo derivado de señales autorizadas; no registro oficial |
| `GET /api/lms/courses/:contextId/analytics` | profesor relacionado/admin; analítica derivada |
| `GET /api/admin/academic-analytics` | admin |

## Convenciones obligatorias

- Paginación en colecciones, por ejemplo `?cursor=&limit=`; nunca cargar todas las filas de producción en el navegador.
- Idempotency key para acciones susceptibles a reintentos (entregas, QR, pagos).
- Auditoría para notas, asistencia, permisos y operaciones administrativas.
- Validar ownership, matrícula, asignación docente y estado de recursos en la capa de dominio, no sólo en routes.
