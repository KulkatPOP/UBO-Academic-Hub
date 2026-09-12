# Auditoría de fuentes de datos — Demo a backend

Fecha de auditoría: 2026-09-11. Este inventario describe la implementación local actual; no representa una fuente institucional real ni cambia su comportamiento.

## Sesión e identidad

| Fuente actual | Ubicación principal | Responsabilidad actual | Tabla/servicio futuro |
|---|---|---|---|
| `uboSession` | `app.js`, `core/demo-identity-session.js` | Sesión legacy del estudiante y snapshot de datos demo | `sessions` / `POST /api/auth/login` + token seguro |
| `uboDemoIdentityV1` (`sessionStorage`) | `core/demo-identity-session.js` | Identidad demo activa para guards de shells | token de acceso/refresh; no replicar en almacenamiento legible |
| `uboRememberedUser` | `app.js` | Recordar usuario demo en login | preferencia local opcional, nunca contraseña |
| datos de `data/users.js` | `data/users.js`, `services/institutional-session-service.js` | Credenciales y perfiles simulados | `users`, credenciales migradas a `password_hash` |

## Académico y comunicación

| Fuente actual | Ubicación principal | Responsabilidad actual | Tabla futura propuesta |
|---|---|---|---|
| catálogos `data/university/courses.js`, `careers.js`, `rooms.js`, `schedules.js` | `data/university/` | Cursos, carreras, salas y horarios demo de lectura | `courses`, `careers`, `rooms`, `schedules` |
| `data/students.js`, `data/professors.js`, `data/courses.js` | `data/` | Relaciones demo alumno/profesor/curso | `student_profiles`, `teacher_profiles`, `enrollments` |
| `data/university/grades.js` | `data/university/grades.js` | Notas académicas demo de referencia | `evaluations`, `grades` |
| `data/university/attendance.js` | `data/university/attendance.js` | Historial base de asistencia demo | `attendance_records` |
| `data/university/materials.js` | `data/university/materials.js` | Material académico de referencia | `learning_materials` |
| `uboDemoTeacherAttendance` | `teacher-attendance-management-service.js` | Cambios docentes demo de asistencia | `attendance_records` |
| `uboDemoTeacherGrades` | `teacher-grade-management-service.js` | Notas docentes demo separadas | `grades` |
| `uboDemoTeacherMaterials` | `teacher-material-management-service.js` | Material docente demo | `learning_materials` |
| `uboDemoTeacherAnnouncements` | `teacher-announcement-management-service.js` | Avisos por curso | `course_announcements` |
| `uboDemoMessages` | `message-service.js` | Mensajes profesor-estudiante | `messages` |
| `uboDemoQrAttendanceSessions` | `qr-attendance-service.js` | Sesiones QR efímeras demo | `attendance_sessions` |
| `uboDemoQrAttendanceRecords` | `qr-attendance-service.js` | Marcaciones QR demo | `attendance_records` |
| `uboDemoEvaluations` | `evaluation-service.js` | Evaluaciones online demo | `evaluations` |
| `uboDemoSubmissions` | `evaluation-service.js` | Entregas, nota y feedback demo | `submissions` |
| `uboDemoQuestionBank` | `evaluation/question-bank-service.js` | Banco de preguntas del profesor | `questions` |

## IA, analítica y recomendaciones

| Fuente actual | Ubicación principal | Responsabilidad actual | Tabla/servicio futuro |
|---|---|---|---|
| `uboDemoKnowledgeBase` | `ai/knowledge-base-service.js` | Base RAG demo inmutable | `knowledge_documents`, `knowledge_chunks` |
| `uboDemoTutorHistory` | `ai/academic-tutor-service.js` | Historial de consultas/respuestas | `tutor_history` |
| `uboDemoRecommendationsHistory` | `recommendation/academic-recommendation-service.js` | Snapshots de plan/recomendaciones | `recommendations_history` |
| `data/university/analytics.js` | `data/university/analytics.js` | Métricas institucionales demo | agregados/materialized views de analítica |
| `academic-risk-service.js` | `services/analytics/` | Riesgo calculado read-only | `GET /api/students/:id/risk` (derivado, no tabla primaria) |

## Otros módulos demo e ինտerfaz local

| Fuente actual | Ubicación principal | Responsabilidad actual | Destino futuro |
|---|---|---|---|
| `data/university/library.js` + estado legacy `uboLibraryState` | `data/university/`, `app.js` | Catálogo y reserva local | `library_items`, `library_loans`, `library_reservations` |
| `data/university/events.js` | `data/university/events.js` | Eventos e inscripciones demo | `events`, `event_registrations` |
| `data/university/casino.js` | `data/university/casino.js` | Menú y operaciones demo | `casino_menus`, `meal_orders` |
| `data/university/payments.js` | `data/university/payments.js` | Pagos demo | `payments`, `payment_transactions` |
| `data/university/emergencies.js` | `data/university/emergencies.js` | Catálogo y reportes demo | `emergency_reports` |
| `uboThemePreference` | `theme-preference-service.js` | Preferencia visual personal | permanece cliente; opcional `user_preferences` |
| `uboReminders`, `uboNotificationState` | `app.js` | Recordatorios y estado de lectura local | `calendar_events`, `notifications`, `notification_reads` |
| `uboCommunityPosts` | `app.js` | Comunidad y comentarios locales | `community_posts`, `community_comments` |
| `uboDocumentRequests`, `uboDaeRequests`, `uboTechnicalSupport`, `uboPublicSupport` | `app.js` | Solicitudes demo | tablas por dominio o `service_requests` |
| `uboGradeSimulator` | `app.js` | Simulaciones personales no oficiales | preferencia/estado local; no migrar como nota |

## Observaciones de migración

1. Los catálogos `data/university/*` son semillas de desarrollo, no evidencia de producción.
2. `localStorage` no ofrece transacciones, aislamiento multiusuario ni autorización de servidor; no puede ser la fuente de verdad al migrar.
3. La simulación de notas, tema visual y recordatorios personales deben evaluarse por separado: no todos requieren persistencia institucional.
4. No migrar contraseñas demo; crear cuentas reales con hash resistente (Argon2id o bcrypt) y flujo de alta/restablecimiento independiente.
