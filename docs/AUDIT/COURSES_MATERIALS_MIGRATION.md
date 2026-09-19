# Migración progresiva de cursos y materiales

## Inventario anterior

| Fuente | Contenido | Consumidores principales | Identificadores |
| --- | --- | --- | --- |
| `app.js` | Cursos y materiales de la interfaz Student legacy | Inicio, ramos, detalle, materiales, evaluaciones y Tutor | `subjectId`: `db`, `iot`, etc. |
| `data/university/courses.js` | Cursos institucionales DEMO | Servicios Teacher, Student y Admin | `course-db-2026-1`, `course-iot-2026-1` |
| `data/university/materials.js` | Materiales institucionales DEMO | Servicios de material Teacher/Student | `courseId`: `course-db-2026-1` |
| `learning_materials` / `knowledge_base` | Material y conocimiento para RAG DEMO | `knowledge-base-service.js`, `academic-tutor-service.js` | `course_reference`: `database`, `algebra`, `programming` |

Los dashboards Teacher y Admin consultan servicios locales de cursos. El Tutor IA, RAG, evaluaciones, mensajería, QR, recomendaciones, notas y asistencia continúan sobre sus fuentes DEMO actuales.

## Nueva capa

```text
Frontend API opcional
  -> /api/courses y /api/materials
  -> lms_courses / lms_course_members / learning_materials
  -> PostgreSQL DEMO de Academic Hub
```

La migración `003_lms_courses.sql` crea:

- `lms_courses`: cursos DEMO del LMS complementario; `external_course_id` queda reservado para una futura referencia institucional.
- `lms_course_members`: membresía DEMO indispensable para aislamiento del LMS. **No representa matrícula oficial UBO.**
- `learning_materials.lms_course_id`: relación explícita hacia el curso LMS, preservando `course_reference` para RAG legacy.

Los seeds asignan los cursos DEMO Bases de Datos, Álgebra y Programación a Carlos Pérez y la membresía DEMO correspondiente a Sofía Martínez. Son idempotentes.

## Endpoints y aislamiento

| Endpoint | Contexto | Resultado |
| --- | --- | --- |
| `GET /api/courses` | `x-user-id` | Student: sólo membresías DEMO; Teacher: sólo asignados; Admin: todos los cursos DEMO. |
| `GET /api/courses/:id` | `x-user-id` | Devuelve sólo un curso permitido. |
| `GET /api/courses/:courseId/materials` | `x-user-id` | Materiales del curso autorizado. |
| `GET /api/materials/:id` | `x-user-id` | Material si su curso es accesible. |

El backend recupera el rol desde `users_reference`; ignora cualquier rol que el cliente intente enviar. Nunca devuelve `password_demo`.

## Fallback y activación de interfaz

`services/api/course-api-service.js` y `services/api/material-api-service.js` consultan API primero. Ante indisponibilidad de red devuelven el fallback que les entregue la interfaz, clonado y sin mutar los datos locales.

La interfaz legacy no se activa aún contra estos endpoints. Sus IDs (`db`, `iot`) no coinciden de forma uno-a-uno con los de la API (`course-db-2026-1`, etc.) ni con el RAG (`database`). Activarla sin un adaptador de equivalencias rompería navegación, detalle y servicios académicos. Por esta razón se mantiene el fallback local actual y se documenta la migración como pendiente.

## Alcance y futuro

Academic Hub sigue siendo un LMS complementario. Las futuras integraciones UBO deberán sustituir las referencias DEMO mediante una fuente institucional autorizada; no deben interpretar `lms_course_members` como matrícula oficial. Tutor/RAG no se migraron en esta fase y conservan plena compatibilidad.

## Validación local de PostgreSQL

Durante esta fase se ejecutó `npm run db:migrate`. El entorno no pudo establecer conexión con PostgreSQL, por lo que el proceso se detuvo antes de ejecutar `npm run db:seed`; no se declara aplicada la migración `003` ni los seeds. Las rutas y reglas de aislamiento se validaron mediante pruebas de integración con un pool PostgreSQL simulado. Una vez que PostgreSQL esté disponible, deben ejecutarse en orden `npm run db:migrate` y `npm run db:seed`, y luego repetir las pruebas HTTP reales.
