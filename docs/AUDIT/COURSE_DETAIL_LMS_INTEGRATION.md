# Detalle de curso LMS integrado

## Arquitectura

La pantalla existente `course-detail` sigue siendo la única vista de detalle
del estudiante. La nueva sección **Datos del LMS Academic Hub** compone clientes
API existentes mediante `Promise.all`; no se creó un endpoint agregado ni una
tabla de detalle.

`app.js` -> `course-detail-api-service.js` -> APIs LMS -> PostgreSQL.

Cada API conserva `x-user-id` como único contexto de identidad. La pantalla no
decide autorización, no transmite contraseña, rol ni `studentId` en body/query.
El backend valida membresía contra `lms_course_members` para cada recurso.

## APIs reutilizadas

- Courses API: ficha autorizada del curso.
- Course Identity API: resuelve únicamente aliases documentados; `db` se
  resuelve hacia su `lmsCourseId` y `iot` mantiene fallback si no hay evidencia.
- Materials, Evaluations, Progress, QR Attendance, Recommendations y Messages.
- Tutor API: se invoca bajo demanda con el `lmsCourseId` resuelto y el contexto
  de sesión; el historial privado no se carga automáticamente.

Las recomendaciones, evaluaciones y mensajes se filtran por el `courseId`
devuelto por el LMS. Material visto nunca se presenta como material completado.
Las evaluaciones se etiquetan como **Evaluación LMS**, separadas de cualquier
nota oficial.

## Fallback, datos parciales y privacidad

Si la identidad legacy no está confirmada o la ficha del curso no está
disponible, la vista DEMO preexistente permanece intacta. Si falla una sección
independiente, las demás siguen visibles y la sección informa indisponibilidad.
Una colección vacía se muestra como estado vacío, no como error.

`INSUFFICIENT_DATA` se representa como actividad insuficiente y los porcentajes
generales no se inventan: `overall` continúa en `null`.

El detalle de curso representa información del LMS Academic Hub y no constituye información académica oficial de la Universidad.

## Limitaciones deliberadas

- No se creó una relación nueva de identidad para `iot`.
- La ficha pública de curso no expone nombres adicionales de docentes: la UI no
  muestra identificadores internos.
- No hay métricas de finalización de materiales sin eventos de actividad reales.
- El modo API conserva el fallback DEMO cuando el backend no está disponible.
