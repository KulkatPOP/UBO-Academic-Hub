# Recomendador académico personalizado demo

## Arquitectura

`services/recommendation/academic-recommendation-service.js` reúne lecturas existentes de perfil, cursos, riesgo académico, evaluaciones, banco de preguntas incorporado por el servicio de evaluaciones, materiales y base de conocimiento. Deriva recomendaciones sin modificar ninguna fuente académica. El historial `uboDemoRecommendationsHistory` guarda únicamente snapshots de sugerencias demo y planes de estudio por estudiante. El Tutor consume este resultado para las consultas de mejora, evitando una dependencia circular.

## Reglas transparentes

- Promedio demo menor a 4,0: reforzar contenidos fundamentales.
- Asistencia demo menor a 75%: recuperar clases y mejorar asistencia.
- Más del 50% de respuestas objetivas incorrectas por tema: revisar el material asociado al tema.
- Promedio desde 5,5 y asistencia desde 85%: continuar estrategia actual.

El plan contiene tres acciones orientativas de repaso, práctica y aplicación, con recursos de la base de conocimiento cuando existen. Profesor recibe un resumen por curso y Admin un indicador de áreas prioritarias.

## Límites

Es una recomendación local y explicable, no una decisión institucional ni una predicción real. No hay IA externa, API, backend ni modificación de notas, asistencia o evaluaciones oficiales.
