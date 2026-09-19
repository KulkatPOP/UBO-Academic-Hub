# Recomendaciones académicas API-first — Fase 2.19

## Auditoría de origen

El recomendador local `services/recommendation/academic-recommendation-service.js` continúa intacto. Usa exclusivamente datos DEMO locales: `academic-risk-service`, evaluaciones, materiales Student, base de conocimiento y `uboDemoRecommendationsHistory`.

| Categoría | Datos | Estado en esta fase |
|---|---|---|
| Institucional futura | promedio oficial, asistencia oficial, matrícula y cursos oficiales | No presentes ni consumidos por la API |
| LMS Academic Hub | `lms_courses`, `lms_course_members`, `learning_materials`, `knowledge_base`, `recommendations` | Consumidos de sólo lectura para sugerencias de recursos |
| Derivada | riesgo, temas débiles, recomendaciones y plan de estudio | Riesgo/temas locales permanecen en el fallback; la API deriva recursos disponibles |

Las recomendaciones son información derivada y no constituyen registros académicos oficiales.

## Arquitectura

```text
Student autenticado (x-user-id)
  → recommendation-api-service
  → /api/recommendations[/generate]
  → recommendation-service
  → users_reference + lms_course_members
  → learning_materials
  → recommendations (snapshot derivado)
```

El backend toma al estudiante sólo desde `x-user-id`; ignora `studentId` de query o body y no acepta un rol del cliente como autoridad. Cada lectura y cada `getRecommendationById` quedan acotados al `student_reference` propio.

## Reglas preservadas y datos insuficientes

Las reglas locales existentes no fueron trasladadas de forma ficticia:

- promedio bajo: sólo aplica en el servicio DEMO si existe promedio DEMO;
- asistencia baja: sólo aplica en el servicio DEMO si existe asistencia DEMO;
- tema débil: sólo aplica en el servicio DEMO si existen respuestas evaluables;
- buen rendimiento: sólo aplica en el servicio DEMO si promedio y asistencia DEMO existen.

PostgreSQL no tiene todavía notas, asistencia ni evaluaciones LMS suficientes para recalcular esas reglas. Por lo tanto, la API genera únicamente `AVAILABLE_RESOURCE` cuando hay un material LMS autorizado real. Si no existen cursos o recursos, devuelve `dataSufficient: false` o una lista vacía: nunca convierte ausencia de datos en cero, riesgo o bajo rendimiento.

`resourceReference` apunta al UUID existente de `learning_materials`; no se generan URLs ni recursos ficticios. La columna `course_id` de la migración `005_recommendation_fields.sql` referencia al curso LMS, y no a matrícula institucional.

## Persistencia y fallback

La migración 005 agrega campos derivados a `recommendations` sin eliminar sus snapshots JSONB históricos. Un índice único parcial permite refrescar la misma sugerencia por estudiante, curso, tipo y recurso mediante UPSERT. No se modifican materiales, notas, asistencia, evaluaciones ni membresías.

`services/api/recommendation-api-service.js` opera API-first y conserva un parámetro `fallback`. La interfaz Student mantiene el recomendador local como fuente de reglas de rendimiento mientras PostgreSQL no tenga los indicadores equivalentes, y añade de forma progresiva los recursos LMS devueltos por la API. Si la API falla, la experiencia local y `uboDemoRecommendationsHistory` quedan intactos.

Tutor mantiene su dependencia unidireccional hacia el recomendador local. No se creó una relación Tutor → API Recommendation → Tutor.

## Validación PostgreSQL y HTTP

La migración `005_recommendation_fields.sql` y la semilla idempotente se aplicaron sobre PostgreSQL local. Con la sesión de Sofía, `GET /api/recommendations` y `POST /api/recommendations/generate` devolvieron únicamente recomendaciones de sus tres cursos LMS DEMO autorizados: Bases de Datos, Álgebra y Programación. Cada resultado tuvo un `resourceReference` existente y no expuso credenciales.

Una generación repetida comprobó que permanecían iguales los conteos de membresías LMS, materiales, evaluaciones y entregas. La tabla `recommendations` es la única fuente que se refresca mediante UPSERT.

## Integración institucional futura

Cuando UBO entregue fuentes autorizadas de promedio, asistencia y matrícula, deberán llegar mediante adaptadores explícitos. Sólo entonces se podrán habilitar en backend las reglas equivalentes, con origen y fecha de datos trazables. Academic Hub sigue siendo un LMS complementario.
