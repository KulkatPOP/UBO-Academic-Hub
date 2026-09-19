# Migración progresiva de evaluaciones LMS a API

## Alcance

La Fase 2.20 incorpora una capa LMS complementaria para evaluaciones y entregas DEMO. No reemplaza las evaluaciones, notas, asistencia ni matrícula oficiales de UBO. Las evaluaciones y calificaciones de este módulo pertenecen al LMS Academic Hub y no constituyen registros académicos oficiales de la universidad.

## Arquitectura

```text
Interfaz existente (sin activación forzada)
  -> services/api/evaluation-api-service.js
  -> /api/evaluations y /api/submissions
  -> evaluation-service.js
  -> PostgreSQL: lms_evaluations, evaluation_questions, lms_submissions
```

La interfaz conserva `services/evaluation-service.js`, `question-bank-service.js` y su fallback local. El adaptador API permite una activación posterior por flujo, sin romper la experiencia DEMO que ya existe. Esta fase no redirige de forma forzada los renderizadores síncronos ya desplegados: la adopción visual queda como siguiente paso reversible, por pantalla y conservando el fallback cuando la API no esté disponible.

## API LMS

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/evaluations` | Lista las evaluaciones visibles para el contexto del usuario. |
| POST | `/api/evaluations` | Crea un borrador como profesor propietario del curso. |
| GET | `/api/evaluations/:id` | Consulta una evaluación autorizada. |
| POST | `/api/evaluations/:id/publish` | Publica un borrador propio. |
| POST | `/api/evaluations/:id/submit` | Registra una entrega única del estudiante inscrito. |
| GET | `/api/evaluations/:id/submission` | Recupera la entrega propia. |
| GET | `/api/evaluations/:id/submissions` | Recupera entregas para revisión del profesor dueño. |
| POST | `/api/submissions/:id/grade` | Guarda revisión LMS DEMO del profesor dueño. |

El contexto se transporta exclusivamente en `x-user-id`. No se envían ni persisten contraseñas en las respuestas de estas rutas.

## Reglas aplicadas

- Un profesor sólo crea, publica o revisa evaluaciones de sus cursos LMS.
- Un estudiante sólo ve y responde evaluaciones publicadas de cursos donde está inscrito.
- Las evaluaciones cerradas o vencidas no admiten entrega.
- El índice único de `lms_submissions` bloquea duplicados por evaluación y estudiante.
- Preguntas objetivas obtienen un resultado automático LMS en escala 1,0–7,0; las respuestas cortas quedan pendientes de revisión.
- El `score` de `lms_submissions` está documentado y aislado como resultado LMS DEMO; nunca se escribe en una tabla de notas oficiales.

## Persistencia y límites

La migración `006_lms_evaluation_structure.sql` crea tablas y restricciones propias del LMS complementario. No toca datos oficiales de calificaciones, asistencia, inscripción o curso institucional. La semilla mantiene los perfiles DEMO existentes y no crea evaluaciones artificiales.

No se incorporan JWT, OAuth, SSO, backend institucional ni automatización de notas oficiales. La autorización actual se basa en el contexto DEMO existente y debe sustituirse por identidad institucional antes de producción.

## Validación

Las pruebas de backend cubren creación, publicación, inscripción, vencimiento, duplicados, revisión y aislamiento. Las pruebas del adaptador frontend comprueban el encabezado de contexto, la ausencia de credenciales y el fallback controlado.
