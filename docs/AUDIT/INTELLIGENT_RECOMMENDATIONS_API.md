# Recomendaciones inteligentes LMS

Las recomendaciones inteligentes se generan a partir de señales y recursos existentes del LMS Academic Hub; no constituyen instrucciones académicas oficiales de la Universidad.

## Arquitectura

`Academic Intelligence` entrega señales explicables; `intelligent-recommendation-service` las relaciona con evaluaciones, materiales o cursos autorizados; `recommendation-service` continúa siendo la única capa de lectura/persistencia UPSERT de la tabla `recommendations`.

Los endpoints de sólo lectura son `GET /api/recommendations/intelligent` y `GET /api/recommendations/intelligent/:courseId`. Ambos toman exclusivamente `x-user-id`; no aceptan identidad, rol o curso como autoridad desde body/query.

## Decisiones

- `PENDING_EVALUATION` + evaluación `PUBLISHED` real: `COMPLETE_EVALUATION`.
- `LOW_ATTENDANCE_LMS` o `LOW_SUBMISSION_RATE` + material autorizado: `REVIEW_MATERIAL`.
- Las mismas señales sin material: `REVIEW_COURSE` sobre el curso autorizado, sin inventar contenido.
- Sin señal/recurso verificable: `recommendations: []` y `recommendationStatus: INSUFFICIENT_DATA`.

La selección de material es determinista: primer recurso del orden estable del servicio (fecha de creación y título). Toda decisión incluye tipo, prioridad, trigger, razón, evidencia, recurso y fuente `LMS`. La prioridad es HIGH para señal HIGH o riesgo HIGH con evaluación pendiente; WARNING es MEDIUM; INFO es LOW.

## Seguridad y límites

No se crean recursos, mensajes, evaluaciones, notas, asistencias ni recomendaciones en un `GET`. Los recursos pertenecen al curso validado por `lms_course_members`. Los resultados no exponen contraseñas, tokens, QR, mensajes ni conversaciones privadas. Teacher y Admin no tienen acceso a esta capa Student.

Las decisiones son derivadas y no se almacenan. Una recomendación persistida existente puede vincularse por su recurso, y su UPSERT/idempotencia sigue siendo responsabilidad exclusiva de `recommendation-service`. No hay expiración automática nueva.

## UI y Tutor

El dashboard Student añade las decisiones en la tarjeta existente de Inteligencia LMS, sin mezclar métricas DEMO. Si la API falla por red conserva el fallback DEMO; respuestas 401/403 no usan fallback. El Tutor recibe `recommendedActions` estructuradas junto al contexto de inteligencia y no genera afirmaciones fuera de sus fuentes.
