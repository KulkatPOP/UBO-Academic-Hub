# Mapa de relaciones objetivo

```text
users
├─ student_profiles ──< enrollments >── courses ──< schedules >── rooms
│                         │                 │
│                         │                 ├── teacher_profiles (profesor asignado)
│                         │                 ├── evaluations ──< submissions
│                         │                 │       └── evaluation_questions >── questions
│                         │                 ├── attendance_sessions ──< attendance_records
│                         │                 ├── learning_materials
│                         │                 ├── course_announcements
│                         │                 └── knowledge_documents ──< knowledge_chunks
│                         │
│                         ├── messages (emisor/receptor vinculados al curso)
│                         ├── tutor_history
│                         └── recommendations_history
│
└─ teacher_profiles ──< courses

careers ──< student_profiles
careers ──< courses
```

## Cardinalidades y reglas relevantes

- Un `user` tiene como máximo un perfil de estudiante o profesor; `ADMIN` puede no tener perfil académico.
- Un estudiante se matricula en muchos cursos y cada curso tiene muchos estudiantes mediante `enrollments`.
- Una evaluación pertenece a un curso y puede incluir muchas preguntas del banco por `evaluation_questions`.
- Una entrega pertenece a un estudiante y una evaluación; el par es único.
- Una sesión de asistencia pertenece a curso y profesor; sus registros son únicos por estudiante.
- Material, avisos, preguntas y documentos de conocimiento pertenecen a un curso.
- Mensajes se limitan por destinatario y, cuando llevan `course_id`, por una relación docente/matrícula válida.
- Riesgo, recomendaciones e indicadores son proyecciones calculadas: no duplican las notas o asistencia primarias.

## Límites de dominio

Biblioteca, casino, pagos, eventos y emergencias deben conservar sus propios agregados y tablas. Se relacionan con `users` cuando proceda, pero no deben mezclarse con `enrollments` ni con el esquema de calificaciones.
