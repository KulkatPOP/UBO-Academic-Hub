# Visualización de notas para Student

## Objetivo

Sofía puede consultar exclusivamente sus notas demo registradas por el Profesor, tanto en Inicio como dentro del detalle de cada ramo.

## Fuente y modelo

La única fuente es `uboDemoTeacherGrades`, gestionada por `teacher-grade-management-service.js`. Cada nota utiliza el modelo existente: `id`, `courseId`, `studentId`, `teacherId`, `assessmentName`, `value`, `createdAt` y `updatedAt`.

`student-grade-service.js` solo lee esa fuente, filtra por `student-sofia-martinez` y por los cursos institucionales a los que está inscrita. Devuelve copias defensivas ordenadas por `createdAt` descendente.

## Seguridad y aislamiento

No expone creación, edición ni eliminación. Los registros de otros estudiantes y cursos no inscritos no se muestran. Títulos de evaluaciones se insertan con `textContent`, por lo que texto HTML se muestra literalmente y no se ejecuta.

Los datos JSON inválidos se informan con un estado controlado y no se eliminan desde la vista Student. Si no existe almacenamiento local, se presenta un estado controlado.

## Flujo y UX

Profesor crea, edita o elimina una nota → `uboDemoTeacherGrades` → Sofía la ve al actualizar Inicio o el detalle del ramo correspondiente. Inicio limita la sección a tres registros; el curso muestra todos los propios. La nota institucional y su promedio no se reemplazan: no se calcula ni presenta un promedio oficial desde estas notas demo.

## PWA, pruebas y rollback

El service worker `v123` incorpora el nuevo servicio. `tests/student-grade.test.js` cubre lectura, orden, aislamiento, persistencia, edición/eliminación de Profesor, contenido XSS, copias defensivas y errores de almacenamiento.

Para revertir la fase, retirar el servicio Student, sus renderizados y la entrada de precache; esto no altera las notas del Profesor, Material, Asistencia, Avisos, Admin, sesión ni Core. Una evolución futura requerirá una fuente institucional de evaluaciones y permisos reales.
