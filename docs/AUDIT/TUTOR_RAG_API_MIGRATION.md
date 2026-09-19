# Migración progresiva Tutor IA y RAG hacia API

## Estado anterior

El Tutor DEMO local se compone de `academic-tutor-service.js`, `knowledge-base-service.js`, `localStorage` (`uboDemoTutorHistory`), analítica y recomendaciones locales. Es de sólo lectura sobre datos académicos y no modifica notas, asistencia o evaluaciones.

## Capa API incorporada

```text
Student autenticado DEMO
  -> services/api/tutor-api-service.js
  -> /api/tutor/ask o /api/tutor/history
  -> tutor-service / knowledge-service
  -> lms_course_members -> lms_courses -> learning_materials -> knowledge_base
  -> tutor_conversations
```

El servicio verifica que el contexto sea un usuario `STUDENT`, resuelve el curso en PostgreSQL y comprueba la membresía DEMO antes de buscar conocimiento o materiales. El encabezado `x-user-id` identifica el contexto DEMO; el rol y cualquier `userId` enviado por body/query se ignoran.

## Endpoints

- `POST /api/tutor/ask` recibe únicamente `query` y `courseId`.
- `GET /api/tutor/history` devuelve sólo las conversaciones del `x-user-id`; no acepta seleccionar a otro usuario mediante query string.

Las respuestas contienen respuesta, fuentes reales de `knowledge_base`/`learning_materials`, temas, curso y conversación. No incluyen `password_demo`, credenciales, datos de otros estudiantes ni respuestas de evaluaciones.

## Historial y fallback

Las conversaciones API se persisten en `tutor_conversations` mediante el `external_id` interno de la referencia de estudiante. El servicio frontend conserva un parámetro `fallback`: ante API caída, la interfaz puede seguir usando `academic-tutor-service.js` y `uboDemoTutorHistory` sin mutar ni perder el historial DEMO.

## Límite de activación visual

El widget Student legacy no se conectó todavía a esta API. Su contexto usa `student-sofia-martinez` y sus datos RAG locales usan referencias diferentes a los UUIDs de PostgreSQL. Unirlos requeriría inventar un mapeo entre IDs legacy, institucionales, LMS y RAG, prohibido para esta fase. El fallback local sigue activo y sin regresiones.

## Limitaciones

Academic Hub continúa como LMS complementario: `lms_course_members` es membresía DEMO, no matrícula oficial UBO. El motor no usa IA externa; construye la respuesta sólo con conocimiento y material autorizado disponible. Recomendaciones y analítica permanecen en sus servicios actuales, evitando dependencias circulares.
