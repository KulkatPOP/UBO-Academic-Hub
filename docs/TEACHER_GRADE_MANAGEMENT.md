# Gestión de notas demo para Profesor

## Objetivo y alcance

Carlos Pérez puede crear, editar y eliminar notas demo desde sus cursos asignados. Es una capacidad local del Panel Profesor: no modifica Student, Admin, login, logout, Core, backend ni las notas institucionales.

## Modelo y almacenamiento

Cada nota demo contiene `id`, `courseId`, `studentId`, `teacherId`, `assessmentName`, `value`, `createdAt` y `updatedAt`. Se almacena de forma aislada en `localStorage` bajo `uboDemoTeacherGrades`; no contiene contraseñas, sesiones, tokens o permisos. La precisión es de una decimal y acepta coma o punto como separador.

## Cursos, estudiantes y validación

El servicio consume cursos y estudiantes institucionales ya existentes. Valida curso, inscripción del estudiante, rol `TEACHER`, relación del profesor con el curso, nombre de evaluación, duplicado lógico por curso/estudiante/evaluación y rango `1,0–7,0`. Student y Admin no reciben acceso automático.

## Operaciones y datos institucionales

Las notas institucionales se muestran como referencia y permanecen de solo lectura. Las notas locales se etiquetan como demo, permiten edición con `updatedAt` y eliminación con confirmación. Un registro corrupto de esta clave se descarta de forma controlada sin tocar `uboSession`, demo identity o datos institucionales.

## PWA, tests, límites y rollback

El servicio ESM se incorpora al precache del detalle docente y la cache pasa a `ubo-academic-hub-v118`. `tests/teacher-grade.test.js` cubre normalización, validación, creación, edición, eliminación, persistencia, corrupción, aislamiento y protección de datos institucionales. No se implementan ponderaciones, promedio oficial, actas, publicación, API, backend o sincronización. El rollback es retirar la sección y el servicio; los demás perfiles no dependen de esta clave local.
