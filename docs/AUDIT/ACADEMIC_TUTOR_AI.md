# Tutor IA Académico DEMO

## Arquitectura

`services/ai/academic-tutor-service.js` utiliza reglas locales. Construye contexto desde perfil del estudiante, cursos, analítica de riesgo, materiales y evaluaciones demo. Para consultas de contenido recupera únicamente documentos locales compatibles con los cursos inscritos mediante `knowledge-base-service.js`. No usa modelos externos, APIs ni backend.

## Contexto y respuestas

El contexto identifica cursos, promedio/asistencia demo, evaluaciones pendientes, preguntas objetivas incorrectas, temas débiles y materiales visibles. El motor responde a consultas sobre contenido, planificación de estudio y avance personal; entrega recomendaciones explicables.

## Historial y seguridad

Las últimas conversaciones se guardan localmente en `uboDemoTutorHistory`, separadas por `studentId`. El tutor no modifica notas, asistencia, materiales, evaluaciones ni acciones académicas. La interfaz construye nodos mediante `createElement` y `textContent`.

## Limitaciones

Esto no es IA generativa real ni asesoría académica oficial. Las respuestas son plantillas orientativas basadas exclusivamente en datos demo disponibles en el dispositivo.
