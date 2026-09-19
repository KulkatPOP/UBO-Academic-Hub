# Ficha técnica — UBO Academic Hub Release 1.0

| Campo | Estado real |
| --- | --- |
| Nombre | UBO Academic Hub |
| Versión | Release 1.0 |
| Tipo | LMS local DEMO preparado documentalmente para futura integración institucional |
| Frontend | HTML5, CSS3, JavaScript ES Modules y PWA |
| Backend | Node.js con Express y CORS |
| Database | PostgreSQL local en Docker; migraciones y seed DEMO bajo `backend/src/database/` |
| PWA | Manifest, iconos, Service Worker `ubo-academic-hub-v195` y shell offline básico |
| Roles | Student, Teacher, Admin |

## Componentes

- LMS: cursos, membresías, materiales, progreso, asistencia LMS/QR, evaluaciones y avisos según el rol.
- Progress: métricas derivadas del LMS local, sin ponderar ausencias de evidencia.
- Intelligence: reglas deterministas, explicables y de solo lectura.
- Recommendations: decisiones sobre señales y recursos LMS autorizados.
- Tutor/RAG: conocimiento local autorizado y contexto LMS del curso permitido.

## Seguridad actual

- Sesiones persistentes locales en PostgreSQL.
- Cookie `HttpOnly`, `SameSite=Lax`, expiración y revocación por logout.
- Persistencia del token mediante hash; no se expone su valor en respuestas de API.
- Aislamiento por rol y pertenencia a curso en backend.
- Rutas privadas `/api/*` fuera del precache PWA.

Este alcance es DEMO/local; no equivale a SSO institucional, seguridad productiva completa ni integración oficial de UBO.

## Testing confirmado

- Frontend: **113/113** pruebas aprobadas.
- Backend: **51/51** pruebas aprobadas.
- Core: `npm test` y `npm run check` aprobados en su proyecto separado.
- Sintaxis JavaScript y PWA/ESM: validaciones registradas sin errores.

## Límites y frontera institucional

Los datos son DEMO/LMS local. No hay SSO, sincronización, cursos, matrícula, notas ni asistencia oficiales de UBO. La futura integración requiere contratos de identidad, fuentes autorizadas, identificadores estables, reglas de actualización, ambiente QA y responsables institucionales.
