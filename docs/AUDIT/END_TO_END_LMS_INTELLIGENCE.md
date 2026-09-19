# Orquestación end-to-end del LMS inteligente

La orquestación se mantiene en el frontend sobre APIs existentes: sesión backend → cursos → identidad de curso → `course-detail-api-service` → progreso, inteligencia y recomendaciones → Tutor/RAG. No existe endpoint agregado, tabla adicional ni caché de respuestas privadas.

## Student

Con sesión `uboAcademicSession` de origen `backend`, las tarjetas LMS declaran su origen y conservan DEMO sólo como fallback ante indisponibilidad de red. Los estados 401/403 no activan fallback. El detalle de curso tolera APIs parciales y el Tutor se consulta bajo demanda con curso autorizado.

## Teacher y Admin

Teacher conserva cursos, estudiantes y analítica de sus cursos. Admin conserva sólo analítica agregada. Ninguno recibe Inteligencia individual Student, conversaciones privadas, mensajes, credenciales ni QR.

## Seguridad, persistencia y límites

La identidad se resuelve desde `x-user-id`; query/body no son autoridad. Course membership controla detalle, progreso, inteligencia, recomendaciones y Tutor. Las consultas de detalle, inteligencia y recomendaciones no escriben recursos ni registros académicos. El historial del Tutor existente puede persistir por usuario, sin memoria académica nueva.

Tras reiniciar Express, PostgreSQL conserva cursos, materiales, asistencia LMS, preferencias y recomendaciones existentes. La PWA precachea módulos estáticos; no cachea respuestas API privadas. Los datos LMS y DEMO no se presentan juntos como una misma fuente.
