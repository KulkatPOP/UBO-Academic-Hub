# Visualización de avisos para Student

## Objetivo y flujo

Los avisos creados por Carlos Pérez se guardan en `uboDemoTeacherAnnouncements`. La experiencia Student consulta esa misma fuente mediante un servicio exclusivo de lectura y presenta solamente los avisos de cursos donde Sofía está inscrita.

## Seguridad y aislamiento

El servicio no exporta operaciones de creación, edición ni eliminación. Entrega copias defensivas, filtra por `courseId` asociado al estudiante y recupera de forma controlada ante almacenamiento corrupto o no disponible. La UI agrega título y contenido mediante `textContent`; etiquetas HTML se muestran como texto, sin ejecución.

## Alcance y límites

La Home muestra hasta tres avisos recientes y un estado vacío. No hay notificaciones, adjuntos, confirmación de lectura, backend ni publicación institucional. Student no modifica los avisos ni la gestión del Profesor.

## PWA y rollback

La PWA v121 incluye el servicio Student. El rollback consiste en retirar su sección visual, servicio, prueba, documentación y precache; la fuente local y Profesor no requieren migración.
