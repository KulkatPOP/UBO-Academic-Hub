# Evaluaciones online demo

## Alcance

Esta fase agrega un flujo local de evaluaciones online entre Profesor y Student. No reemplaza las evaluaciones, ponderaciones ni notas institucionales existentes.

## Datos locales

- `uboDemoEvaluations`: evaluaciones publicadas por el profesor asignado al curso.
- `uboDemoSubmissions`: respuestas individuales enviadas por estudiantes inscritos.

Los registros incluyen solamente identificadores de curso, profesor y estudiante. No se comunican a un servidor ni se incorporan a calificaciones oficiales.

## Flujo

1. El profesor publica una evaluación demo desde el detalle de un curso propio.
2. El estudiante inscrito la visualiza en **Evaluaciones online demo** y puede responderla una vez antes de la fecha límite.
3. El profesor revisa respuestas y publica una nota demo y un comentario.
4. Student recibe alertas derivadas de solo lectura: evaluación enviada y resultado publicado.

En esta primera versión, cada publicación crea una pregunta demo única según el tipo seleccionado (alternativa o desarrollo), usando la descripción como contexto. La creación de bancos de preguntas queda fuera de alcance.

## Controles

- El profesor debe ser responsable del curso.
- El estudiante debe estar inscrito en el curso.
- No se permiten respuestas duplicadas, evaluaciones vencidas, tipos inválidos ni notas fuera del rango 1,0–7,0.
- Todo el contenido de la interfaz se crea con DOM seguro y `textContent`.

## Limitaciones demo

No hay backend, autenticación real, banco de preguntas, corrección automática, sincronización entre dispositivos ni integración con las notas oficiales.
