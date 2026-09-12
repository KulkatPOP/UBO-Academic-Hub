# Base de conocimiento académica y RAG demo

## Arquitectura

`services/ai/knowledge-base-service.js` contiene `uboDemoKnowledgeBase`, una colección local, estática y de solo lectura. Sus documentos demo se asocian por `courseId` e incluyen tema, contenido, palabras clave, nivel y fuente.

El tutor consulta primero los cursos institucionales del estudiante. Para cada curso inscrito ejecuta `searchKnowledge(question, courseId)`, ordena las coincidencias por relevancia y utiliza hasta tres resultados. No consulta cursos ajenos ni servicios externos.

## Recuperación y cita

La búsqueda normaliza acentos y compara consulta, título, tema, palabras clave y contenido. Cuando hay una coincidencia, la respuesta usa el contenido del primer resultado y conserva las fuentes recuperadas en `uboDemoTutorHistory` como `sources`. La interfaz muestra “Resultado basado en: 📚 Material del curso”.

## Alcance y límites

Esto es RAG simulado: no genera embeddings, no usa un modelo de lenguaje, API, backend ni documentos institucionales reales. Los contenidos son demostrativos y la capa no modifica notas, asistencia, evaluaciones ni materiales académicos oficiales.
