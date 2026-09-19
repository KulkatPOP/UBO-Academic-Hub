# Progreso LMS derivado

El progreso mostrado por esta capa representa actividad y avance dentro del LMS Academic Hub y no constituye progreso académico oficial de la Universidad.

No se creó tabla de progreso. El servicio deriva métricas desde `lms_courses`, `lms_course_members`, `learning_materials`, `lms_evaluations`, `lms_submissions`, `lms_attendance_sessions`, `lms_attendance_records` y `analytics_events`.

## Métricas

- Materiales: `available` es el total LMS; `viewed` sólo existe cuando hay eventos reales `MATERIAL_VIEW`. Visualizar no equivale a completar.
- Evaluaciones: publicadas, entregadas, pendientes y tasa de entrega; no usa notas oficiales.
- Asistencia: sesiones LMS, registros presentes y tasa sólo cuando existen sesiones.
- Actividad: eventos LMS existentes por curso. No se crean eventos para calcular progreso.

La falta de evidencia se devuelve como `null` y `INSUFFICIENT_DATA`, nunca como cero. `overall` permanece `null` porque no existe una regla de negocio aprobada para ponderar las métricas.

## API, permisos y fallback

`GET /api/progress/student` y `GET /api/progress/student/:courseId` resuelven al estudiante exclusivamente desde `x-user-id`. El segundo endpoint exige matrícula en el curso; curso ajeno responde `403` y ausente `404`. No admite identidad o rol desde body/query.

`progress-api-service.js` usa la sesión LMS sin contraseñas. El panel de progreso existente se hidrata desde LMS sólo con respuesta válida; si falla, conserva el progreso DEMO. No hay cambio a notas, asistencia o matrícula institucional.
