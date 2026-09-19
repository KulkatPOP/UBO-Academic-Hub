# Course Identity Mapping — Fase 2.18

## Propósito

Academic Hub mantiene identificadores de curso de varias capas. Esta fase incorpora una resolución explícita, reversible y acotada al LMS DEMO para que Tutor, RAG y materiales puedan converger en el UUID del LMS sin modificar los IDs legacy ni los datos académicos oficiales.

Los mappings DEMO no representan necesariamente equivalencias con el sistema académico institucional UBO.

## Auditoría de identificadores

| Tipo | Ejemplo | Fuente | Uso | Estado |
|---|---|---|---|---|
| `LEGACY_FRONTEND_ID` | `db` | `app.js`, datos de navegación y `data/mappings/courses-map.js` | Ramo legacy de Student | Evidencia DEMO para Bases de Datos |
| `LEGACY_FRONTEND_ID` | `iot` | `app.js`, `data/mappings/courses-map.js` | Ramo legacy de Student | Pendiente: no existe un LMS `Programación IoT` equivalente en PostgreSQL |
| `LMS_COURSE_ID` | UUID de `lms_courses.id` | PostgreSQL | Autorización, materiales y RAG API | DEMO propio de Academic Hub |
| `INSTITUTIONAL_EXTERNAL_ID` preparado | `course-db-2026-1` | `lms_courses.external_course_id` y seed | Referencia externa preparada | DEMO; no es ID oficial UBO confirmado |
| `RAG/KNOWLEDGE_REFERENCE` | `database` | `learning_materials.course_reference` | Materiales y conocimiento RAG heredados | Evidencia DEMO explícita hacia Bases de Datos |
| `RAG/KNOWLEDGE_REFERENCE` | `algebra`, `programming` | `learning_materials.course_reference` | Materiales y conocimiento RAG heredados | Se resuelven por su curso LMS, sin alias frontend adicional confirmado |

La semilla ya enlazaba `database` con `course-db-2026-1` mediante `learning_materials.lms_course_id`. Además, `db` se usa en el frontend para Bases de Datos y el mapa existente lo declara disponible. Por ello se registran dos aliases DEMO independientes hacia el mismo curso LMS:

| Alias | Curso LMS DEMO | Referencia externa preparada | Fuente | Certeza |
|---|---|---|---|---|
| `db` | Bases de Datos | `course-db-2026-1` | Frontend, mapa legacy y seed | Evidencia DEMO documentada |
| `database` | Bases de Datos | `course-db-2026-1` (obtenida desde LMS) | Seed de materiales/RAG | Evidencia DEMO documentada |

No se creó un mapping para `iot`: el frontend nombra **Programación IoT**, mientras que el LMS actual contiene **Programación**. La similitud no es evidencia suficiente.

## Arquitectura

```text
legacy / RAG alias / LMS UUID / referencia externa preparada
                    ↓
     course_identity_mapping + lms_courses
                    ↓
          course-identity-service
                    ↓
  autorización LMS → learning_materials → knowledge_base → Tutor
```

`course_identity_mapping` permite varios aliases para un LMS, pero prohíbe que un alias legacy o una referencia externa se relacione con más de un curso LMS. La columna `confidence` se mantiene `NULL` en las semillas DEMO: no se usa para declarar certeza institucional.

Una validación de base de datos además exige que cualquier `external_course_id` registrado en el mapping sea el mismo que declara ese `lms_course_id`; los aliases RAG sin referencia externa siguen permitidos.

## API y aislamiento

- `GET /api/course-identity/resolve?identifier=...` devuelve sólo identidad pública normalizada.
- El parámetro `type` es una pista de interfaz; el backend resuelve todos los espacios conocidos y rechaza un resultado ambiguo.
- `knowledge-service` y `material-service` normalizan primero hacia `lmsCourseId`; luego la membresía del usuario controla el acceso.
- Tutor admite `courseId` o `legacyCourseId`, pero nunca acepta rol ni usuario desde el body como autoridad.

## Pendientes

1. Revisar formalmente mappings de `iot`, `english`, `cyber`, `skills` y otros aliases legacy.
2. Confirmar referencias externas con la fuente institucional antes de usar `source = INSTITUTIONAL`.
3. Activar el widget Tutor API sólo tras aprobar los mappings que use su interfaz legacy.
4. Mantener los fallbacks demo y localStorage hasta una migración funcional posterior.

## Validación de la fase

La migración `004_course_identity_mapping.sql` y la semilla idempotente se ejecutaron sobre PostgreSQL local. La consulta posterior confirmó los aliases `db` y `database` con `source = DEMO` y `confidence = null`.

La prueba HTTP verificó `/api/database/health` y la resolución del mismo curso por alias legacy, referencia externa preparada, UUID LMS y alias RAG. Una consulta real al Tutor con `legacyCourseId: "db"` devolvió fuentes autorizadas y el UUID LMS; no devolvió contraseñas.
