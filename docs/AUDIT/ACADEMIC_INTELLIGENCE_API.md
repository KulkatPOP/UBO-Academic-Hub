# Inteligencia Académica LMS — Fase 2.31

## Alcance

La capa de Inteligencia Académica calcula una representación temporal, explicable y de sólo lectura desde PostgreSQL LMS. No crea una tabla de perfil, no escribe recomendaciones nuevas, no modifica matrícula, notas oficiales ni asistencia oficial.

> La inteligencia académica representa señales derivadas de actividad dentro del LMS Academic Hub y no constituye diagnóstico ni evaluación académica oficial de la Universidad.

## Arquitectura

`Fuentes LMS → academic-intelligence-service → señales/evidencia → interpretación conservadora → acciones existentes → Tutor/RAG`.

Fuentes permitidas: `users_reference`, cursos y membresías LMS, materiales, evaluaciones, entregas, sesiones/registros de asistencia, eventos analíticos y recomendaciones ya persistidas. No utiliza `localStorage`, contenido DEMO del frontend, conversaciones privadas, mensajes, contraseñas ni tokens como evidencia.

## Endpoints y permisos

- `GET /api/intelligence/student`
- `GET /api/intelligence/student/:courseId`

La identidad se obtiene exclusivamente de `x-user-id`, se resuelve contra `users_reference` y debe tener rol `STUDENT`. El curso usa la validación existente de matrícula; curso inexistente devuelve 404 y curso ajeno 403. Query/body no pueden suplantar usuario, rol o curso.

## Señales y evidencia

Cada señal incluye `code`, `severity`, `reason`, `evidence`, `dataSource`, `courseId` y `courseName`.

- `PENDING_EVALUATION`: hay evaluación publicada sin entrega.
- `LOW_SUBMISSION_RATE`: hay dos o más evaluaciones pendientes; reutiliza el umbral ya presente en Analytics LMS.
- `LOW_ATTENDANCE_LMS`: asistencia LMS inferior a 75%; reutiliza el umbral existente.
- `HIGH_EVALUATION_COMPLETION`, `GOOD_ATTENDANCE_LMS` y `MATERIAL_ENGAGEMENT`: fortalezas observables, nunca juicios sobre el estudiante.
- `INSUFFICIENT_DATA`: no hay evaluación publicada, sesión de asistencia registrada ni interacción de material que permita una señal confiable.

No se genera `LOW_ACTIVITY` o `NO_RECENT_ACTIVITY` por mera ausencia de eventos. La tendencia es `INSUFFICIENT_DATA` hasta que exista historial temporal LMS suficiente; no se usan fechas de creación o login como sustituto.

## Riesgo, atención y estudio

El riesgo reutiliza `calculateLmsRisk` de Analytics LMS: dos pendientes, promedio LMS bajo 4,0 o asistencia bajo 75% pueden elevarlo, siempre que exista evidencia. Sin evidencia suficiente el resultado es `INSUFFICIENT_DATA`, nunca `LOW` o `HIGH`.

Las áreas de atención conservan la señal original. Las necesidades de estudio son concretas pero no inventan temas: `COMPLETE_PENDING_EVALUATION` y `REVIEW_COURSE_CONTENT`. Las acciones pueden enlazar sólo recursos existentes ya devueltos por `recommendation-service`; la inteligencia no persiste ni duplica recomendaciones.

## Tutor/RAG y privacidad

El Tutor puede recibir un contexto estructurado con señales, fortalezas, áreas de atención y acciones del curso. El contexto no contiene credenciales, QR, mensajes ni conversaciones completas. Si no hay evidencia, el Tutor recibe el estado de datos insuficientes y no afirma una tendencia o tema inexistente.

## Frontend y fallback

`services/api/academic-intelligence-api-service.js` usa la sesión backend consolidada y transmite sólo `x-user-id`. El dashboard reutiliza la sección de estado académico como “Inteligencia académica”. Si la API no está disponible, permanece la experiencia DEMO existente y no se mezclan métricas DEMO con métricas LMS.

## Limitaciones

- Datos y umbrales son DEMO del LMS complementario.
- No hay ML, LLM como fuente de verdad, diagnóstico ni predicción clínica.
- Sin historial temporal no hay tendencia.
- La cabecera `x-user-id` es una identidad DEMO hasta integrar autenticación institucional verificable.
