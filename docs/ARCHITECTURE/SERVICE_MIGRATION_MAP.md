# Mapa de migración de servicios

| Servicio actual | Origen actual | Clasificación | Destino API inicial |
|---|---|---|---|
| `auth-service.js`, `institutional-session-service.js` | usuarios/sesión demo | autenticación propia + federación futura | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/users/me` |
| `course-service.js`, `student-service.js`, `professor-service.js` | catálogos JS | consumidor de datos externos | `GET /integration/student/courses`, `GET /integration/student/profile` |
| `attendance-service.js`, servicios de asistencia docente/estudiante y QR | datos estáticos + localStorage | consumir asistencia oficial; QR LMS separado | `GET /integration/student/performance`; endpoints LMS QR propios |
| `grade-service.js` | datos demo | consumidor de rendimiento institucional | `GET /integration/student/performance` |
| `evaluation-service.js`, `question-bank-service.js` | datos demo + localStorage | LMS propio | `GET/POST /api/evaluations`, `GET/POST /api/questions`, `POST /api/evaluations/:id/submissions` |
| servicios de material y avisos | datos demo + localStorage | migración directa con autorización | `GET/POST /api/courses/:id/materials`, `GET/POST /api/courses/:id/announcements` |
| `message-service.js` | `uboDemoMessages` | migración directa | `GET/POST /api/messages`, `PATCH /api/messages/:id/read` |
| `academic-risk-service.js`, `academic-analytics-service.js`, recomendador | cálculo frontend + señales demo | consumir datos externos y producir derivaciones propias | `GET /integration/student/performance`, `GET /api/students/:id/recommendations`, `GET /api/courses/:id/analytics` |
| `academic-tutor-service.js` | contexto local | servicio propio adaptado a integración | `GET /api/tutor/context`, `POST /api/tutor/question` |
| `knowledge-base-service.js` | conocimiento demo local | servicio propio | `GET /api/knowledge/search`, gestión interna de documentos/contenido |
| `message-service.js` | `uboDemoMessages` | LMS propio | `GET/POST /api/messages`, `PATCH /api/messages/:id/read` |
| `theme-preference-service.js` | `uboThemePreference` | permanece frontend | opcional `PUT /api/users/me/preferences` |
| `library-service.js`, `event-service.js`, `casino-service.js`, `payment-service.js`, `emergency-service.js` | `data/university/*` | migración por dominio | APIs separadas bajo `/api/library`, `/api/events`, `/api/casino`, `/api/payments`, `/api/emergencies` |
| adaptadores Core/career/room | contratos canónicos locales | mantener como borde de compatibilidad | repositorios HTTP futuros detrás de puertos, sin activar flags actuales |

## Patrón de transición recomendado

1. Mantener la interfaz contra contratos de servicio, no contra `localStorage` directamente.
2. Crear implementaciones `*ApiService` paralelas que devuelvan el mismo contrato de lectura/escritura controlada.
3. Activar por módulo y por rol mediante feature flag de servidor, con rollback al adaptador demo.
4. Tras reconciliación y telemetría, retirar la implementación demo sólo en una fase explícita.

No migrar `app.js` directamente a llamadas HTTP: primero encapsular las claves legacy que aún se leen allí.
