# Tutor contextualizado LMS

El Tutor contextualizado utiliza evidencia y recursos autorizados del LMS Academic Hub para personalizar sus respuestas; no constituye una evaluación académica oficial ni reemplaza las fuentes institucionales de la Universidad.

## Contexto derivado

`POST /api/tutor/ask` conserva su contrato y añade `context`, `contextSummary` y `source: LMS`. Para un curso autorizado combina RAG (`knowledge-service`), materiales autorizados, progreso derivado, señales/fortalezas/áreas de atención y decisiones de recomendaciones inteligentes. Sin curso usa únicamente señales y acciones globales, nunca carga materiales de todos los cursos.

El orden de autoridad es: datos estructurados LMS, materiales/RAG, contexto derivado y, finalmente, texto del Tutor. La respuesta reconoce `INSUFFICIENT_DATA` y ausencia de tendencia en vez de inventar avance, notas o asistencia.

## Privacidad y límites

La identidad se toma exclusivamente de `x-user-id`. Se valida matrícula antes de recuperar contexto de curso. No se incluyen mensajes, notificaciones, respuestas de evaluaciones, conversaciones ajenas, contraseñas, tokens ni QR. No se crea memoria nueva: el historial `tutor_conversations` existente continúa aislado por estudiante y no se usa como autoridad académica.

El fallback DEMO aplica sólo ante indisponibilidad de red/API; 401 y 403 se muestran como errores de autorización. Teacher y Admin no reciben contexto individual por este flujo.
