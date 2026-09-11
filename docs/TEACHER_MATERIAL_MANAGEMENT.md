# Gestión de material del curso para Profesor

## Objetivo y alcance

La funcionalidad permite a Carlos Pérez (`teacher-carlos-perez`, `TEACHER`) gestionar referencias de material demo desde el detalle de sus cursos. No modifica la aplicación estudiante, Admin, login, logout, guards existentes, Core ni datos institucionales de material.

## Modelo y almacenamiento

Los materiales creados localmente tienen `id`, `courseId`, `teacherId`, `title`, `description`, `type` y `createdAt`. Se guardan bajo la clave aislada `uboDemoTeacherMaterials` de `localStorage`; nunca se almacenan contraseñas, tokens, credenciales ni binarios. Los materiales institucionales existentes se conservan como solo lectura.

## Cursos y aislamiento

La capa valida que el curso exista y que `course.professorId` coincida con una identidad `{ id, role: "TEACHER" }`. El filtrado usa `courseId` y `teacherId`, por lo que un material de Bases de Datos no aparece en IoT. Student y Admin no obtienen acceso automático a la gestión.

## Creación y eliminación

El formulario pide título, descripción opcional y tipo (`DOCUMENTO`, `PRESENTACIÓN`, `VIDEO`, `GUÍA`, `OTRO`). Rechaza títulos vacíos o mayores a 120 caracteres, descripciones mayores a 1000 caracteres, tipos inválidos, cursos inexistentes, perfiles no docentes y duplicados locales por curso. Cada material local puede eliminarse mediante confirmación; solo se borra ese registro del almacenamiento local.

## Navegación y seguridad

El flujo es Selector Demo → Profesor → Curso → Material y el enlace existente permite volver a cursos. El guard docente continúa siendo la autoridad de ruta; el detalle además no habilita gestión para un curso no asignado al Teacher actual. Los datos corruptos de esta única clave se restablecen de forma controlada sin tocar `uboSession`, demo identity u otras claves.

## Límites, PWA y rollback

No hay subida de archivos, multimedia real, backend, API, nube, notificaciones, Core Session, Authorization Core ni permisos institucionales. El nuevo módulo ESM local se agrega al precache de la PWA; no se añade Core ni `127.0.0.1`. El rollback consiste en retirar la sección y su servicio: Student/Admin/login/guards no dependen de ellos; opcionalmente se puede borrar solo `uboDemoTeacherMaterials` para retirar contenido demo local.

## Tests y futuras mejoras

`tests/teacher-material.test.js` cubre creación, lectura, persistencia, aislamiento de curso/rol, recuperación ante corrupción y eliminación. Próximas mejoras posibles: edición con historial, un repositorio institucional autorizado y adjuntos gestionados por backend.
