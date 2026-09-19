# Resumen ejecutivo — UBO Academic Hub Release 1.0

UBO Academic Hub Release 1.0 es una base LMS local funcional para demostración, entrega académica y evolución técnica. Reúne una PWA para Student, Teacher y Admin, una API Express local, PostgreSQL en Docker y servicios LMS complementarios. La solución está documentada para evolucionar hacia una integración institucional, pero no está conectada a sistemas reales de UBO ni usa datos institucionales.

## Qué resuelve

El proyecto organiza experiencias académicas diferenciadas por rol. Student puede consultar su dashboard, cursos, materiales, progreso, asistencia LMS, recomendaciones y Tutor contextualizado. Teacher administra su contexto de cursos, estudiantes, materiales, evaluaciones, asistencia, avisos y analítica disponible. Admin accede a un overview de métricas agregadas del LMS.

## Arquitectura y estado

La PWA frontend usa ES Modules y consume una API Express local. El backend opera sobre PostgreSQL local y contiene migraciones y seed DEMO. El frontend conserva fallback DEMO/local de forma controlada ante falta de API. La versión actual de Service Worker es `ubo-academic-hub-v195` y las rutas privadas `/api/*` no entran en precache.

La entrega cuenta con 113 pruebas frontend y 51 pruebas backend aprobadas. UniEcosystemCore se mantiene separado y sus validaciones relevantes están aprobadas en su proyecto propio. Las auditorías visuales documentan Light Mode, Dark Mode y responsive para Student, Teacher y Admin.

## Inteligencia y Tutor

La inteligencia académica no es Machine Learning ni una predicción institucional. Utiliza reglas deterministas y evidencia LMS local para exponer señales explicables. No modifica notas, asistencia ni matrícula. Cuando faltan datos, mantiene resultados conservadores mediante `INSUFFICIENT_DATA` o valores nulos.

Las recomendaciones enlazan señales verificables con recursos LMS autorizados. El Tutor/RAG consulta conocimiento local autorizado y contexto del curso permitido; no llama modelos externos ni transmite datos a terceros.

## Seguridad y límites

La sesión local utiliza cookie `HttpOnly`, `SameSite=Lax`, expiración, revocación por logout y persistencia de hash de token. Rol y pertenencia a curso se verifican en backend, reduciendo el riesgo de spoofing desde cliente. Estas protecciones corresponden a un entorno local DEMO y no sustituyen controles productivos institucionales como SSO, CSRF ampliado, rate limiting, TLS, observabilidad o gestión corporativa de secretos.

## Preparación institucional

Release 1.0 incluye contratos y documentación que delimitan cómo avanzar hacia una integración institucional. Para continuar, UBO deberá aportar SSO/IdP, identificadores estables, datos autorizados de cursos y matrícula, reglas de actualización, información académica oficial si corresponde, ambiente QA y responsables técnicos. La integración real no forma parte de esta entrega.

## Límites declarados

Los usuarios, identidades, cursos, métricas y credenciales son DEMO/LMS local. No hay sincronización institucional ni fuente oficial UBO. La licencia no está definida (`LICENSE_STATUS = NOT_DEFINED`). La entrega debe entenderse como una base funcional, inteligente y documentada para una siguiente etapa institucional, no como una plataforma productiva ya integrada.
