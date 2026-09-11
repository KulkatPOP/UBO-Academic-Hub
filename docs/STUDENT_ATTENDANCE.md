# Visualización de asistencia para Student

## Objetivo y fuente

Sofía consulta en modo lectura los registros demo publicados por Profesor. La única fuente es `uboDemoTeacherAttendance`, administrada por `teacher-attendance-management-service.js`; no existe una copia Student.

## Modelo y estados

Se respeta el modelo existente: `id`, `courseId`, `studentId`, `teacherId`, `date`, `status`, `createdAt` y `updatedAt`. Los estados son `PRESENT`, `ABSENT` y `JUSTIFIED`, presentados como Presente, Ausente y Justificado.

## Aislamiento y cálculo

`student-attendance-service.js` solo muestra registros de `student-sofia-martinez` que además pertenecen a cursos institucionales donde Sofía está inscrita. Devuelve copias defensivas ordenadas por fecha descendente.

El porcentaje demo se calcula únicamente sobre registros realizados: `(PRESENT + JUSTIFIED) / total de registros`. No se inventan sesiones sin registrar y la asistencia institucional ya visible en Student no se modifica ni reemplaza.

## UX y seguridad

Inicio presenta un resumen por curso con su último registro. El detalle del ramo presenta porcentaje, conteos y el historial. Cuando no hay datos se muestra “No hay registros de asistencia.” No existen acciones Student para registrar, editar, justificar o eliminar.

Los textos se insertan mediante `textContent`. JSON corrupto o almacenamiento no disponible producen un estado controlado sin borrar el origen gestionado por Profesor.

## PWA, pruebas y rollback

El service worker `v124` precachea el servicio Student. `tests/student-attendance.test.js` cubre estados, porcentaje con justificados, cambios desde Profesor, aislamiento, orden, persistencia, corrupción y lectura segura.

El rollback consiste en retirar el servicio, renderizados y entrada de precache de esta fase. No altera Profesor, Material, Notas, Avisos, Admin, sesión, guards ni Core. Una evolución futura requerirá una fuente institucional y autorización real.
