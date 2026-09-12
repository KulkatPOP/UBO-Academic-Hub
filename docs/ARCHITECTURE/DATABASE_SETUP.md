# PostgreSQL local para UBO Academic Hub

## Propósito

La base `ubo_academic_hub` pertenece a la capa inteligente complementaria. Almacena exclusivamente datos propios de Hub: materiales LMS/RAG, conocimiento, conversaciones Tutor, recomendaciones, evaluaciones LMS, entregas LMS y eventos analíticos.

No reemplaza ni recibe como fuente de verdad notas oficiales, matrícula oficial, asistencia oficial o usuarios institucionales definitivos. Las referencias `external_id`, `course_reference` y `student_reference` son identificadores de integración/demo, no una copia del ERP.

## Requisitos y arranque

Requiere Docker Desktop y Node.js.

```powershell
cd backend
npm install
npm run db:start
npm run db:migrate
npm run db:seed
npm start
```

La configuración demo está en `.env.example`; no crear ni versionar `.env` real. El contenedor usa el volumen nombrado `ubo_academic_hub_postgres_data` para persistencia local.

## Conexión demo

| Variable | Valor demo |
|---|---|
| Host | `localhost` |
| Puerto | `5432` |
| Base | `ubo_academic_hub` |
| Usuario | `ubo_admin` |
| Contraseña | `ubo_password_demo` |

Las credenciales son exclusivamente locales y de demostración; deben sustituirse por secretos gestionados antes de cualquier entorno compartido.

## Tablas

- `users_reference`: referencias demo/integración de usuarios.
- `learning_materials` y `knowledge_base`: contenido LMS y RAG propio.
- `tutor_conversations` y `recommendations`: datos generados por servicios inteligentes.
- `lms_evaluations` y `lms_submissions`: evaluaciones complementarias, no oficiales.
- `analytics_events`: eventos de uso/analítica propia.

## Health check

Con PostgreSQL levantado y migrado:

```text
GET http://localhost:3001/api/database/health
{"database":"connected"}
```

En desarrollo, si Docker o PostgreSQL no están disponibles, devuelve `503` con `{"database":"unavailable"}` sin impedir que el API base entregue `/api/health`.
