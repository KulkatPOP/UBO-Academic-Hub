# Dashboard administrativo LMS API-first

## Arquitectura y origen

El dashboard administrativo reutiliza `GET /api/analytics/admin/overview` mediante el cliente `analytics-api-service.js`. Cuando la API está disponible, la sección de analítica administrativa se actualiza con origen **Datos del LMS Academic Hub**. Ante falta de sesión, red o error HTTP, se mantiene el dashboard DEMO existente sin mezclar valores LMS y DEMO en una misma métrica.

El dashboard administrativo representa métricas operativas agregadas del LMS Academic Hub y no constituye información académica oficial de la Universidad.

## Mínimo privilegio

El endpoint resuelve `x-user-id` contra `users_reference` y exige `ADMIN` desde PostgreSQL. No confía en `role`, `userId` ni otros parámetros enviados por el cliente. Student y Teacher reciben `403`, aun si agregan `role=ADMIN`. La salida no contiene registros individuales, contraseñas, tokens, QR tokens, cuerpos de mensajes, conversaciones Tutor ni respuestas de evaluaciones.

## Métricas y fuentes

| Métrica | Definición | Fuente |
| --- | --- | --- |
| Usuarios, estudiantes, docentes | `COUNT(*)` por rol | `users_reference` |
| Cursos y matrículas LMS | Conteo de cursos y membresías | `lms_courses`, `lms_course_members` |
| Materiales | Conteo de referencias disponibles | `learning_materials` |
| Evaluaciones | Total y `status = PUBLISHED` | `lms_evaluations` |
| Entregas | Total, revisadas y pendientes derivadas | `lms_submissions` |
| Asistencia LMS | Sesiones y registros | `lms_attendance_sessions`, `lms_attendance_records` |
| Mensajes y notificaciones | Conteos; notificaciones sin leer | `lms_messages`, `lms_notifications` |
| Actividad | Conteo total y conteo por tipo | `analytics_events` |
| Tutor y recomendaciones | Sólo conteos | `tutor_conversations`, `recommendations` |

Un `0` es un conteo real de PostgreSQL. `Datos LMS insuficientes` representa una métrica ausente o no interpretable, y nunca se transforma artificialmente en cero.

## Persistencia y límites

Las métricas son derivadas y no crean tablas nuevas. No se modifican notas oficiales UBO, asistencia oficial ni matrícula institucional. El endpoint no convierte a Admin en lector de contenido privado. La PWA no necesita un nuevo cliente API en esta fase: se reutiliza el cliente de analítica ya precacheado en `ubo-academic-hub-v177`.
