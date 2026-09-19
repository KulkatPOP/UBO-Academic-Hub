# Auditoría final del LMS inteligente — Fase 2.47

Fecha: 2026-09-18
Naturaleza: auditoría de solo lectura. No se modificaron código funcional, esquema, datos LMS, Core, notas oficiales, asistencia oficial ni matrícula.

## 1. Resumen ejecutivo

UBO Academic Hub cuenta con un LMS complementario local que combina frontend API-first, Express y PostgreSQL. La identidad, los cursos LMS, membresías, materiales, sesiones de asistencia LMS, preferencias, recomendaciones persistidas, conversaciones Tutor y sesiones opacas sobreviven al reinicio del proceso Express porque residen en PostgreSQL.

No es una integración institucional UBO ni un reemplazo de los sistemas oficiales. La identidad actual es DEMO, el login utiliza `password_demo`, no existe SSO/IdP y varias áreas aún dependen del fallback DEMO/local. Las señales de inteligencia y recomendaciones son reglas deterministas, explicables y de solo lectura; no son predicción ML ni notas oficiales.

Estado global: **PARTIAL**.

## 2. Arquitectura observada

```text
Frontend UBO (Student / Teacher / Admin)
  ├─ clientes API-first y fallback DEMO/local claramente rotulado
  ├─ cookie de sesión HttpOnly enviada al backend
  └─ Service Worker: shell y módulos estáticos; no cachea /api/*
          ↓
Express :3001 (rutas privadas con requireSession)
  ├─ Auth, usuarios, cursos, materiales, evaluaciones, mensajes, QR
  ├─ progreso, analítica, inteligencia, recomendaciones y Tutor/RAG
  └─ autorización resuelta desde la cookie y PostgreSQL
          ↓
PostgreSQL local (LMS complementario)
  ├─ users_reference, lms_courses, lms_course_members
  ├─ learning_materials, knowledge_base, lms_* y analytics_events
  ├─ recommendations, tutor_conversations, user_preferences
  └─ auth_sessions (hash de token, expiración y revocación)

UniEcosystemCore permanece aislado: no administra la sesión ni autorización runtime de UBO.
```

## 3. Datos realmente presentes en PostgreSQL

Conteos obtenidos por consulta directa de la base local saludable durante esta auditoría:

| Dato / tabla | Cantidad | Origen y persistencia | Estado |
| --- | ---: | --- | --- |
| Usuarios (`users_reference`) | 3 | Semilla DEMO LMS; PostgreSQL | DEMO |
| Cursos (`lms_courses`) | 3 | Semilla LMS complementaria; PostgreSQL | DEMO |
| Matrículas (`lms_course_members`) | 3 | Semilla LMS complementaria; PostgreSQL | DEMO |
| Materiales (`learning_materials`) | 7 | Semilla LMS complementaria; PostgreSQL | READY |
| Base de conocimiento (`knowledge_base`) | 7 | Derivada de materiales seed; PostgreSQL | READY |
| Evaluaciones (`lms_evaluations`) | 0 | Tabla disponible; sin evidencia real actual | INSUFFICIENT_DATA |
| Entregas (`lms_submissions`) | 0 | Tabla disponible; sin evidencia real actual | INSUFFICIENT_DATA |
| Sesiones asistencia LMS | 2 | Datos LMS demo; PostgreSQL | PARTIAL |
| Registros asistencia LMS | 1 | Datos LMS demo; PostgreSQL | PARTIAL |
| Mensajes LMS | 0 | Tabla disponible; sin evidencia real actual | INSUFFICIENT_DATA |
| Notificaciones LMS | 0 | Tabla disponible; sin evidencia real actual | INSUFFICIENT_DATA |
| Eventos de actividad (`analytics_events`) | 0 | Tabla disponible; sin historial | INSUFFICIENT_DATA |
| Recomendaciones persistidas | 3 | Datos LMS demo; PostgreSQL | PARTIAL |
| Conversaciones Tutor | 8 | Historial LMS demo; PostgreSQL | PARTIAL |
| Preferencias (`user_preferences`) | 3 | Preferencias LMS demo; PostgreSQL | READY |
| Sesiones de autenticación (`auth_sessions`) | 25 | Historial local de sesiones persistentes; PostgreSQL | READY |

Estos conteos son del LMS complementario local; no son cifras institucionales UBO.

## 4. Clasificación por componente

Leyenda de categoría: **A** LMS real/persistente; **B** DEMO con fallback; **C** derivado desde LMS; **D** híbrido; **E** pendiente/no implementado.

| Componente | Categoría | Estado | Evidencia / límite |
| --- | --- | --- | --- |
| Autenticación | D | DEMO | API y PostgreSQL; credenciales `password_demo`, sin SSO/IdP. |
| Sesión | A | READY | Cookie HttpOnly + `auth_sessions` persistente y revocable. |
| Usuarios | D | PARTIAL | Perfiles públicos desde PostgreSQL; usuarios DEMO, no directorio institucional. |
| Cursos | D | PARTIAL | Lectura LMS persistente con fallback DEMO; no sincronización oficial. |
| Matrícula | A | DEMO | `lms_course_members` persistente, pero seed DEMO y no fuente oficial. |
| Materiales | D | PARTIAL | Materiales LMS persistentes autorizados; UI conserva fallback DEMO. |
| Evaluaciones | D | INSUFFICIENT_DATA | API/tablas disponibles; cero registros actuales. |
| Entregas | D | INSUFFICIENT_DATA | API/tablas disponibles; cero registros actuales. |
| Asistencia | D | PARTIAL | Sesiones/registros LMS y QR API; no asistencia oficial. |
| Progreso | C | INSUFFICIENT_DATA | Derivado de fuentes LMS; `overall` es `null` por falta de regla. |
| Analítica | C | INSUFFICIENT_DATA | Derivada de LMS; no hay actividad, notas ni historial suficiente. |
| Inteligencia académica | C | PARTIAL | Reglas explicables sobre progreso/analítica, no ML. |
| Recomendaciones | C | PARTIAL | Motor determinista; puede usar recursos y recomendaciones persistidas. |
| Tutor | D | PARTIAL | Endpoint y persistencia de conversaciones; respuestas deterministas, sin modelo externo. |
| RAG | A | PARTIAL | Búsqueda autorizada en `knowledge_base` local; 7 fuentes, sin embeddings/LLM. |
| Mensajes | D | INSUFFICIENT_DATA | API y tabla LMS disponibles; cero mensajes actuales, fallback DEMO. |
| Notificaciones | D | INSUFFICIENT_DATA | API y tabla LMS disponibles; cero registros, fallback DEMO/local. |
| Preferencias | D | READY | Preferencias LMS por usuario + fallback local para tema. |
| Student Dashboard | D | READY | API-first para bloques LMS y fallback DEMO identificado. |
| Teacher Dashboard | D | READY | Lectura LMS autorizada; acciones DEMO se separan/deshabilitan en contexto LMS. |
| Admin Dashboard | D | READY | Overview LMS agregado y dashboard DEMO separado por origen. |
| Course Detail Student | D | READY | Composición API por sección, manejo parcial y fallback identificado. |
| Course Detail Teacher | D | READY | Acepta `?courseId` y `#courseId`; detalle LMS validado visualmente. |
| PWA | D | PARTIAL | Shell offline y precache ESM; datos API privados no se precachean. |

## 5. Autenticación, sesión y seguridad

### Estado actual DEMO

- `POST /api/auth/login` verifica usuario y `password_demo` en `users_reference`; responde con identidad pública, sin devolver contraseña.
- Al autenticar, se genera un token aleatorio de 32 bytes, se persiste únicamente su hash SHA-256 en `auth_sessions` y se entrega como cookie `HttpOnly`.
- Cookie: `SameSite=Lax`, `Path=/`, expiración de 8 horas; `Secure` se activa solo con `NODE_ENV=production`.
- Las rutas privadas usan la cookie para resolver `authenticatedUserId`. Se sobrescriben/eliminan `x-user-id` y `x-role` enviados por el cliente; no son autoridad runtime.
- Logout revoca solo la sesión presente y limpia su cookie; se validó anteriormente que la reutilización posterior recibe `401`.
- La persistencia de `auth_sessions` permite restaurar una sesión después de reiniciar Express, mientras PostgreSQL siga disponible.
- CORS está restringido a orígenes localhost explícitos con credenciales; no usa `*` con credenciales.

### Límites para producción

No hay SSO, OAuth, SAML, JWT, MFA, directorio institucional ni contraseñas con hash de producción. `SameSite=Lax` y CORS local son una mitigación DEMO, no sustituyen CSRF explícito para despliegues institucionales. Faltan validación `Origin`/CSRF ampliada, rate limiting, gestión/rotación de secretos, auditoría de seguridad y política de revocación distribuida.

El aislamiento Student/Teacher/Admin está cubierto por rol resuelto desde PostgreSQL y pertenencia/ownership de curso. Las suites backend validan rechazo de spoofing por query, body y headers falsificados; esto no equivale a una auditoría externa de seguridad.

## 6. Progreso, analítica e inteligencia académica

### Progreso

`GET /api/progress/student` y `GET /api/progress/student/:courseId` derivan materiales, evaluaciones, asistencia y actividad desde tablas LMS autorizadas. Los valores ausentes se expresan como `null` y `INSUFFICIENT_DATA`; `overall` es `null` deliberadamente, porque no existe una ponderación aprobada.

Con los datos actuales: hay materiales y asistencia parcial, pero no evaluaciones, entregas ni actividad. Por ello no puede inferirse finalización de materiales, tendencia ni progreso total.

### Analítica e inteligencia

`GET /api/intelligence/student` y `GET /api/intelligence/student/:courseId` componen progreso, analítica y recomendaciones existentes. Sus señales son deterministas:

- asistencia LMS menor a 75%;
- promedio de entregas LMS menor a 4,0 o entre 4,0 y 5,0 cuando existe;
- evaluaciones LMS pendientes, especialmente dos o más;
- interacción con materiales solo si existe un evento real;
- `INSUFFICIENT_DATA` si falta evidencia de evaluaciones, asistencia o material visto.

El riesgo no es una predicción: es una clasificación transparente basada en umbrales. La tendencia queda `INSUFFICIENT_DATA` al no existir historial temporal LMS. Los endpoints exigen Student y matrícula para el curso solicitado; Student/Teacher/Admin no pueden escalar roles por parámetros.

## 7. Recomendaciones

`GET /api/recommendations/intelligent` y `GET /api/recommendations/intelligent/:courseId` son un motor de reglas. Generan decisiones solo a partir de señales LMS autorizadas y recursos existentes:

- evaluación publicada pendiente → recomendar completar una evaluación;
- asistencia baja o baja tasa de entregas → recomendar material autorizado o revisar el curso;
- sin evidencia o sin recurso → respuesta conservadora `INSUFFICIENT_DATA`/sin decisión.

Las recomendaciones persistidas existentes son referencias LMS demo. La decisión inteligente leída por estos endpoints no escribe recursos ni crea recomendaciones nuevas. No hay modelo ML, ranking aprendido ni idempotencia de una operación de escritura en el endpoint de lectura.

## 8. Tutor y RAG

`POST /api/tutor/ask` es un Tutor contextualizado, no IA generativa externa. Para un Student autorizado:

1. resuelve el curso (incluido alias legacy documentado);
2. valida la matrícula;
3. busca conocimiento local por palabras/temas en `knowledge_base` asociado a materiales autorizados;
4. incorpora contexto mínimo de progreso, señales y recomendaciones;
5. construye una respuesta determinista y guarda la conversación propia.

El RAG actual es recuperación léxica/local sobre 7 documentos, sin embeddings, vector DB, modelo externo ni datos enviados a terceros. El historial existe como conversaciones por estudiante, pero no constituye memoria académica inferida ni perfil permanente. El tutor no modifica notas, asistencia, matrícula ni evaluaciones oficiales. Cuando no hay conocimiento/material/evidencia suficiente, responde con un aviso controlado de insuficiencia.

## 9. Mensajes, notificaciones y preferencias

- Mensajes LMS y notificaciones son persistentes a nivel de tabla/API, autorizados por sesión, pero hoy no poseen registros reales en PostgreSQL. La UI conserva sus componentes DEMO/local como fallback.
- Una notificación LMS de tipo `MESSAGE` puede derivarse de un mensaje LMS real; consultar no crea notificaciones. No hay push, correo ni WebSocket.
- Preferencias: tema y campos permitidos por usuario pueden persistir en `user_preferences`; el tema local permanece como fallback sin sesión/API.

## 10. Dashboards y detalle de curso

Las QA anteriores y la Fase 2.46.2 dan evidencia visual actual:

| Vista | Fuente predominante | Verificación |
| --- | --- | --- |
| Student | API-first LMS con fallback DEMO declarado | Curso Bases de Datos y detalle LMS visibles; dark mode y logout verificados. |
| Teacher | API-first LMS más acciones DEMO separadas | Dashboard, curso, alumnado, material, asistencia y analítica LMS visibles; dark mode y logout verificados. |
| Admin | Overview LMS agregado + bloques DEMO separados | Perfil, resumen, gestión, analítica, dark mode y logout verificados. |

La composición evita presentar una métrica LMS y una DEMO como un mismo valor: cada bloque indica su origen o preserva el fallback cuando la API no está disponible. La navegación del detalle docente da prioridad a `?courseId`, luego acepta `#courseId`, y solo finalmente usa el curso DEMO de reserva. Por construcción, la corrección `#courseId` no rompe `?courseId`; la Fase 2.46.2 abrió el detalle LMS con el identificador de curso vigente.

## 11. PWA

Service Worker actual: `ubo-academic-hub-v192`.

- Precachea shell, HTML/CSS/JS ESM y recursos locales necesarios para Student, Teacher y Admin.
- Las solicitudes `GET /api/*` no se agregan al precache. Las mutaciones no son manejadas por el Service Worker.
- Para documentos se usa network-first con `cache: no-store`, y solo existe fallback de shell offline.
- Las pruebas PWA/ESM aprobadas detectan el grafo de imports y ausencia de Core en precache.

Advertencia conocida: la suite señala `PRECACHE_EXTRA_ASSETS_WARNING` para algunos assets locales; no es un fallo de sintaxis ni una caché de API privada. La instalación/offline en dispositivos reales sigue siendo **NOT_TESTED** en esta auditoría.

## 12. Testing ejecutado en esta auditoría

| Validación | Resultado real |
| --- | --- |
| Salud API | `GET /api/health`: 200, `status: ok` |
| Salud base de datos | `GET /api/database/health`: 200, `database: connected` |
| Docker PostgreSQL | Contenedor `ubo-academic-hub-postgres` healthy |
| Sintaxis UBO | 300 archivos JS, 0 fallos |
| Frontend | `node --test tests/*.test.js`: 113/113 aprobadas |
| Backend | `npm test`: 51/51 aprobadas |
| Core | `npm test` y `npm run check`: aprobados |
| PWA/ESM | Incluido en la suite frontend, aprobado |
| `git diff --check` | Sin errores de whitespace; Git emite avisos CRLF preexistentes |

## 13. Matriz de cobertura

| Área | LMS real | DEMO/fallback | Persistente | API | UI | Seguridad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | Sí, local | Sí | Sesión sí | Sí | Sí | Cookie/rol | DEMO |
| Session | Sí | No | Sí | Sí | Sí | HttpOnly/revocación | READY |
| Student | Parcial | Sí | Parcial | Sí | Sí | Rol/matrícula | PARTIAL |
| Teacher | Parcial | Sí | Parcial | Sí | Sí | Rol/ownership | PARTIAL |
| Admin | Agregado | Sí | Sí | Sí | Sí | Rol ADMIN | PARTIAL |
| Courses | Sí, local | Sí | Sí | Sí | Sí | Membresía/ownership | PARTIAL |
| Enrollment | Sí, local | Sí | Sí | Sí | Indirecta | Membresía | DEMO |
| Materials | Sí | Sí | Sí | Sí | Sí | Curso autorizado | PARTIAL |
| Evaluations | Esquema/API | Sí | Sí | Sí | Sí | Curso/rol | INSUFFICIENT_DATA |
| Attendance | Parcial | Sí | Sí | Sí | Sí | Curso/rol | PARTIAL |
| Progress | Derivado | Sí | No | Sí | Sí | Student/curso | INSUFFICIENT_DATA |
| Analytics | Derivado | Sí | No | Sí | Sí | Rol/curso | INSUFFICIENT_DATA |
| Intelligence | Derivado | Sí | No | Sí | Sí | Student/curso | PARTIAL |
| Recommendations | Parcial | Sí | Sí | Sí | Sí | Student/curso | PARTIAL |
| Tutor | Sí, local | Sí | Conversaciones sí | Sí | Sí | Student/curso | PARTIAL |
| RAG | Sí, local | No | Sí | Interna | Tutor UI | Curso autorizado | PARTIAL |
| Messages | Esquema/API | Sí | Sí | Sí | Sí | Participantes/curso | INSUFFICIENT_DATA |
| Notifications | Esquema/API | Sí | Sí | Sí | Sí | Usuario | INSUFFICIENT_DATA |
| Preferences | Sí | Sí | Sí | Sí | Sí | Usuario | READY |
| PWA | Shell | Sí | Cache local | No aplica | Sí | API fuera de cache | PARTIAL |

## 14. Limitaciones y riesgos técnicos

1. Las identidades, cursos y matrículas actuales son DEMO locales; no hay fuente institucional oficial ni sincronización.
2. No existe evidencia de evaluaciones, entregas, mensajes, notificaciones ni actividad; progreso, analítica, tendencia e inteligencia permanecen parcial o insuficientes.
3. Hay solo un estudiante y un docente seed; el aislamiento adicional se cubre con fixtures/tests, no con una población real.
4. El riesgo e inteligencia son reglas deterministas. No hay ML, entrenamiento, calibración ni validación predictiva.
5. El Tutor/RAG no usa un modelo externo: recuperación léxica local, contexto limitado y respuestas predefinidas. No debe describirse como IA generativa.
6. El backend es local y usa contraseñas demo. No existe SSO, MFA, password hashing de producción, CSRF completo, rate limiting ni monitoreo de seguridad.
7. No hay auditoría operativa, backups, alta disponibilidad, observabilidad, CI/CD ni plan de recuperación validados.
8. La PWA no cachea APIs privadas, pero instalación/offline de dispositivo real queda NOT_TESTED y hay una advertencia de assets extra de precache.

## 15. Qué falta para producción institucional

### CRÍTICO

- SSO/IdP institucional (SAML/OIDC/OAuth según definición UBO) y eliminación de `password_demo`.
- Integración contractual con fuentes oficiales de usuarios, matrícula, cursos, evaluaciones, notas y asistencia.
- Gestión de secretos, hash de contraseñas si corresponde, CSRF/origin policy, rate limiting, auditoría de accesos y revisión de seguridad independiente.
- Modelo de privacidad, consentimiento, retención y gobierno de datos académicos.
- Observabilidad, backups, recuperación, despliegue seguro y CI/CD.

### IMPORTANTE

- Sincronización incremental e idempotente de cursos, matrícula, materiales, evaluaciones y entregas.
- Datos históricos suficientes y reglas académicas aprobadas antes de calcular progreso, tendencias o cualquier alerta.
- Diseño de auditoría de acciones docentes, notificaciones reales y canales institucionales.
- Pruebas E2E de navegador estándar, mobile/PWA instalado y compatibilidad de navegadores.

### MEJORA

- Búsqueda RAG con recuperación de mayor calidad, evaluación de respuestas y curaduría académica.
- Métricas de calidad del contenido, feedback del Tutor y evaluación responsable de cualquier modelo futuro.
- Más perfiles reales de prueba y escenarios de carga/control de concurrencia.

## 16. Conclusión técnica

El proyecto está listo como **LMS complementario local, API-first, persistente y demo**, con controles de sesión y autorización significativos y UI multirol verificada. No está listo para producción institucional: la falta principal no es de interfaz sino de identidad institucional, fuentes oficiales, evidencia académica suficiente y controles operacionales/seguridad de producción.

Estados de cierre: `READY` para sesión persistente, preferencias y base técnica API; `PARTIAL` para UI LMS, cursos/materiales, Tutor/RAG, recomendaciones y asistencia LMS; `DEMO` para identidad y datos seed; `INSUFFICIENT_DATA` para evaluaciones, entregas, actividad, analítica/trend y mensajería/notificaciones actuales. No se declara producción ni predicción ML.
