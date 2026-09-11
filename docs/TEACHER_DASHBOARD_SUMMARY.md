# Resumen avanzado del Dashboard Profesor

## Objetivo

La Fase 1.89 incorpora una vista docente de solo lectura para Carlos Pérez (`teacher-carlos-perez`). Resume cada curso asignado sin alterar las acciones existentes de material, notas, asistencia ni avisos.

## Fuentes y métricas

`teacher-dashboard-summary-service.js` compone datos ya existentes de cursos, estudiantes y los servicios locales de material, notas, asistencia y avisos. Por curso prepara cantidad de estudiantes, materiales, notas demo, avisos, asistencia demo y promedio demo cuando hay registros válidos.

El promedio y la asistencia están identificados explícitamente como **demo**: no son promedios oficiales ni registros institucionales.

## Aislamiento y lectura

El servicio exige un perfil `TEACHER`, limita los cursos a `professorId === teacherId` y descarta estudiantes o registros fuera del curso asignado. No expone escritura, no crea almacenamiento propio y no modifica fuentes.

## UX y seguridad

El dashboard muestra métricas compactas por curso y actividad reciente. El detalle de curso agrega un resumen superior antes de las áreas de gestión existentes. El nuevo renderizado dinámico usa `textContent` y nodos DOM, por lo que los textos demo no se interpretan como HTML.

## Degradación y límites

Si una fuente es inválida o falla, el resumen conserva las métricas de las otras fuentes y añade advertencias internas; la interfaz presenta estados vacíos sin mensajes técnicos. Los datos demo siguen dependiendo del almacenamiento local que ya administran los servicios existentes.

## Pruebas

`tests/teacher-dashboard-summary.test.js` cubre perfil válido o inválido, aislamiento por curso y estudiante, conteos, asistencia, datos vacíos, fuente corrupta, determinismo, copias defensivas y contrato de solo lectura.

## Evolución futura

La futura integración institucional puede sustituir las fuentes locales mediante adaptadores de lectura, manteniendo el contrato preparado para UI y los límites de aislamiento actuales.
