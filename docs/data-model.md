# Modelo de datos institucional futuro

Los modelos de `data/models` son contratos de transición. No sustituyen aún los arreglos ni objetos usados por la PWA estudiante.

## User

Campos:

- `id`
- `name`
- `email`
- `role`

Representa la identidad general de acceso para Student, Teacher o Admin.

## Student

Campos:

- `id`
- `userId`
- `careerId`
- `courses`

Representa el perfil académico del estudiante. En una versión posterior deberá incorporar período académico, estado de matrícula y relaciones de inscripción.

## Teacher

Campos:

- `id`
- `userId`
- `department`
- `assignedCourses`

Representa al docente y sus cursos asignados.

## Course

Campos:

- `id`
- `name`
- `code`
- `teacherId`
- `careerId`
- `students`
- `roomId`
- `scheduleId`

Representa una asignatura institucional. Antes de adoptar el modelo debe definirse cómo soportará múltiples horarios por curso; los datos universitarios actuales usan `scheduleIds`.

## Grade

Campos:

- `courseId`
- `studentId`
- `evaluation`
- `grade`
- `weight`

Representa una calificación. En una evolución posterior se recomienda incluir `evaluationId`, fecha de registro, estado y autor de la carga.

## Attendance

Campos:

- `courseId`
- `studentId`
- `date`
- `status`

Representa un registro por clase. No debe construirse artificialmente desde porcentajes acumulados de asistencia.

## Material

Campos:

- `courseId`
- `title`
- `type`
- `url`

Representa un recurso académico. Su almacenamiento, permisos de descarga y control de versiones requerirán backend institucional.
