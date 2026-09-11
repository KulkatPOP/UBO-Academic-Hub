# Gestión de asistencia demo del Profesor

## Objetivo y alcance

La gestión de asistencia permite a Carlos Pérez registrar, editar y consultar asistencia demo únicamente para sus cursos asignados. Es una funcionalidad local, reversible y separada de la asistencia institucional existente.

## Modelo y almacenamiento

Cada registro contiene `id`, `courseId`, `studentId`, `date` (`YYYY-MM-DD`), `status`, `createdAt` y `updatedAt`, además del `teacherId` de aislamiento interno. Se almacena solo en `localStorage` bajo `uboDemoTeacherAttendance`.

Los estados permitidos son `PRESENT`, `ABSENT` y `JUSTIFIED`. Los estudiantes sin elección no se guardan ni se convierten automáticamente en presentes.

## Reglas

- Solo una identidad `TEACHER` asignada al curso puede operar.
- Un mismo curso, estudiante y fecha se actualiza en lugar de duplicarse.
- Los cursos y estudiantes se validan contra los servicios institucionales de lectura.
- El porcentaje es `(PRESENT + JUSTIFIED) / (PRESENT + ABSENT + JUSTIFIED)`; las sesiones sin registro no entran al denominador.
- Ante datos locales corruptos, se restablece exclusivamente la clave de asistencia demo.
- Si `localStorage` no está disponible, el servicio retorna un error controlado.

## Integridad y rollback

No se escribe `data/university/attendance.js`, no se integra Core, SessionPort, backend ni autorización institucional. Materiales, notas, Student y Admin no se modifican. El rollback consiste en retirar el servicio, su interfaz y la entrada de precache; los datos institucionales no requieren reversión.

## PWA, pruebas y evolución

La PWA precachea el servicio local en la versión `ubo-academic-hub-v119`. `tests/teacher-attendance.test.js` cubre validación, actualización, persistencia, aislamiento, porcentaje, corrupción y la inmutabilidad institucional.

Una evolución futura podría incorporar cierre de sesiones, justificaciones documentadas y sincronización institucional, siempre mediante backend y autorización real.
