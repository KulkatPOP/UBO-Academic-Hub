# Sistema futuro de roles

## Principios

El sistema de roles se mantiene separado de la autenticación actual. `core/session.js` conserva un usuario futuro en memoria y no reemplaza `uboSession`. `core/permissions.js` entrega permisos por rol y `core/router.js` resuelve rutas futuras autorizadas sin navegar todavía.

## STUDENT

Experiencia: estudiante.

Permisos iniciales:

- `student.dashboard.read`
- `student.courses.read`
- `student.grades.read`
- `student.attendance.read`
- `student.simulators.use`

Ruta futura: `student-dashboard`.

El estudiante podrá consultar su información académica, ramos, notas, asistencia y simuladores. La aplicación estudiante actual seguirá siendo la fuente activa hasta una integración aprobada.

## TEACHER

Experiencia: docente.

Permisos iniciales:

- `teacher.dashboard.read`
- `teacher.courses.read`
- `teacher.students.read`
- `teacher.attendance.manage`
- `teacher.grades.manage`
- `teacher.materials.manage`
- `teacher.communication.manage`

Ruta futura: `modules/professor/teacher-dashboard.html`.

El panel docente demo es independiente y consume servicios institucionales futuros. La autorización real deberá validar la pertenencia del profesor a cada curso.

## ADMIN

Experiencia: administración institucional.

Permisos iniciales:

- `admin.dashboard.read`
- `admin.users.manage`
- `admin.professors.manage`
- `admin.careers.manage`
- `admin.courses.manage`
- `admin.rooms.manage`
- `admin.schedules.manage`
- `admin.permissions.manage`
- `admin.analytics.read`

Ruta futura: `modules/admin/admin-dashboard.html`.

El panel administrativo demo permite visualizar gestión y estadísticas. En producción deberá aplicar controles de permisos, auditoría y protección de datos institucionales.

## Reglas de autorización futuras

- Una ruta solo se considera disponible si coincide con el rol y el permiso requerido.
- `canNavigate(route, user)` debe validarse antes de integrar navegación real.
- Los permisos explícitos del usuario prevalecen sobre los permisos por defecto del rol.
- La sesión institucional futura deberá persistirse de forma segura desde un backend; no debe reutilizar la sesión demo actual.
