# Banco de preguntas y corrección automática DEMO

## Arquitectura

- `services/evaluation/question-bank-service.js` administra el banco local `uboDemoQuestionBank`.
- `services/evaluation-service.js` conserva el flujo existente de evaluaciones y entregas en `uboDemoEvaluations` y `uboDemoSubmissions`.
- Las preguntas seleccionadas se copian a la evaluación; el banco permanece reutilizable.

## Tipos

- `MULTIPLE_CHOICE`: opciones indexadas y alternativa correcta local.
- `TRUE_FALSE`: opciones Verdadero/Falso.
- `SHORT_ANSWER`: queda pendiente de revisión docente y no recibe nota automática.

## Corrección

Las preguntas objetivas pesan igual. La conversión demo usa escala 1,0–7,0 y se redondea al medio punto más cercano para lectura simple. Los datos correctos nunca se envían a la vista Student. La retroalimentación indica dominio o recomienda revisar el tema correspondiente.

## Analítica y limitaciones

El profesor puede consultar promedio automático, porcentaje correcto, preguntas más difíciles y temas bajo 60% de acierto. Es una métrica demo local: no modifica notas oficiales ni reemplaza la revisión docente, especialmente para respuestas cortas.
