# Diseño inicial de PostgreSQL de Hub

Este diseño pertenece a UBO Academic Hub, no al sistema académico institucional. Las claves se expresan como UUID, las fechas como `timestamptz` salvo fechas académicas puras (`date`), y los campos de contenido flexible usan `jsonb` solo donde su estructura es deliberadamente variable.

## Separación de fuentes

| Dominio | Autoridad | Política de almacenamiento en Hub |
|---|---|---|
| usuarios académicos, cursos oficiales, matrículas, notas oficiales y asistencia oficial | sistema institucional UBO | consultar mediante integración; cache mínimo y temporal sólo si es aprobado |
| conversaciones Tutor IA, recomendaciones, conocimiento RAG, contenido LMS, materiales inteligentes, configuraciones, preferencias y analítica derivada | UBO Academic Hub | persistir con retención, consentimiento y auditoría propios |

## Referencias institucionales y perfiles de Hub

| Tabla | Campos principales | Relaciones/restricciones |
|---|---|---|
| `hub_users` | `id`, `external_user_id`, `username`, `email`, `role`, `created_at`, `updated_at` | Perfil de plataforma; `external_user_id` identifica la fuente institucional sin duplicar datos académicos completos |
| `user_preferences` | `user_id`, `theme`, `settings`, `updated_at` | Preferencias propias, no expediente académico |
| `integration_sync_log` | `id`, `external_user_id`, `resource`, `source_version`, `synchronized_at`, `status` | Trazabilidad de lecturas institucionales, sin almacenar secreto o payload excesivo |

## LMS y contenido propios

| Tabla | Campos principales | Relaciones/restricciones |
|---|---|---|
| `lms_course_contexts` | `id`, `external_course_id`, `title_snapshot`, `updated_at` | Referencia mínima al curso externo para aislar contenido Hub |
| `evaluations` | `id`, `lms_course_context_id`, `author_id`, `title`, `description`, `type`, `due_date`, `status`, `created_at` | Evaluaciones LMS propias; no son actas ni notas oficiales |
| `questions` | `id`, `course_id`, `teacher_id`, `topic`, `type`, `question`, `options`, `correct_answer`, `difficulty`, `created_at` | `options`/respuesta correctas deben protegerse al consultar como estudiante |
| `evaluation_questions` | `evaluation_id`, `question_id`, `position` | PK compuesta; permite banco reutilizable |
| `submissions` | `id`, `evaluation_id`, `student_id`, `answers`, `submitted_at`, `status`, `grade`, `feedback`, `graded_by`, `graded_at` | Resultado LMS propio; no se publica como nota oficial sin proceso institucional separado |
| `learning_materials` | `id`, `course_id`, `teacher_id`, `title`, `content_url`, `topic`, `keywords`, `type`, `created_at` | `content_url` apunta a almacenamiento de objetos futuro, no a binario en PostgreSQL |
| `course_announcements` | `id`, `course_id`, `teacher_id`, `title`, `content`, `published_at` | Sólo lectura de estudiantes matriculados |

## Comunicación, IA y analítica

| Tabla | Campos principales | Relaciones/restricciones |
|---|---|---|
| `messages` | `id`, `sender_id`, `receiver_id`, `course_id`, `subject`, `content`, `created_at`, `read_at` | Emisor/receptor deben tener relación autorizada con el curso cuando aplique |
| `knowledge_documents` | `id`, `course_id`, `title`, `topic`, `content`, `keywords`, `source`, `created_at` | Documento fuente RAG; acceso por matrícula/asignación |
| `knowledge_chunks` | `id`, `document_id`, `content`, `position`, `embedding` opcional | Preparado para búsqueda semántica posterior; no obliga IA externa |
| `tutor_history` | `id`, `student_id`, `question`, `response`, `sources`, `created_at` | `sources` como `jsonb`; retención definida institucionalmente |
| `recommendations_history` | `id`, `student_id`, `recommendations`, `study_plan`, `created_at` | Snapshot explicable; no sustituye decisiones académicas |
| `notification_events` | `id`, `user_id`, `type`, `payload`, `created_at`, `read_at` | Reemplaza estados locales de notificación |

## Criterios operacionales

- Aplicar migraciones versionadas (por ejemplo, SQL migraciones transaccionales), llaves foráneas e índices antes de cargar datos propios.
- Implementar RLS o controles de consulta equivalentes en API: las restricciones frontend no bastan.
- Cifrar secretos y minimizar datos personales. Auditoría de accesos y retención son requisitos previos a datos reales.
- El historial de simuladores personales, tema y onboarding no debe migrarse automáticamente como historial académico oficial.
- No crear tablas espejo de `enrollments`, `attendance_records` institucionales ni `grades` oficiales en esta base.
