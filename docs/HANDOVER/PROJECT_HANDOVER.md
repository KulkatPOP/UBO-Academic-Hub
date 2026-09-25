# UBO Academic Hub — Manual de entrega

## Qué es el proyecto

UBO Academic Hub es una aplicación académica local con experiencias separadas para Student, Teacher y Admin. Funciona actualmente como **LMS local con datos DEMO y datos LMS persistentes**. No está conectado a sistemas institucionales reales de UBO.

La integración con sistemas institucionales reales de UBO queda fuera del alcance de esta entrega y requiere los contratos, mecanismos de autenticación y fuentes de datos que la institución proporcione.

## Arquitectura general

```text
Frontend estático (ES Modules + PWA, puerto 3000)
  → API Express local (puerto 3001)
  → PostgreSQL local en Docker (puerto 5432)
```

El frontend usa API-first para componentes LMS y conserva fallback DEMO/local cuando la API no está disponible. El backend persiste sesiones, cursos LMS, membresías, materiales, preferencias, conversaciones Tutor y otros recursos propios del LMS. UniEcosystemCore permanece separado y no debe modificarse para operar este proyecto.

## Requisitos

- Node.js compatible con el `package.json` de `backend`.
- npm.
- Docker Desktop con Docker Compose.
- Un servidor HTTP estático para el frontend (por ejemplo, Python o una herramienta equivalente).

El backend no declara por ahora una versión mínima de Node mediante `engines`; validar compatibilidad con sus dependencias al preparar un entorno nuevo. La guía documenta el procedimiento de levantamiento, pero no sustituye una verificación de instalación limpia en el entorno de destino.

No use una fuente institucional real ni credenciales institucionales durante el levantamiento local.

## Levantar PostgreSQL y backend

Desde la raíz del proyecto:

```powershell
cd backend
npm install
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm start
```

Verificación local:

```powershell
Invoke-WebRequest http://localhost:3001/api/health -UseBasicParsing
Invoke-WebRequest http://localhost:3001/api/database/health -UseBasicParsing
```

Las migraciones y el seed son idempotentes según sus claves actuales, pero deben ejecutarse en una base local de desarrollo/QA, nunca sobre una fuente institucional.

## Levantar frontend

En otra terminal, desde la raíz del proyecto:

```powershell
python -m http.server 3000
```

Abrir `http://localhost:3000`. Servir por HTTP es necesario para ES Modules y Service Worker. El selector institucional demo permite acceder a los tres roles.

## Usuarios DEMO

Estas credenciales son únicamente DEMO; no son institucionales ni deben reutilizarse fuera del entorno local.

| Rol | Usuario | Contraseña DEMO |
| --- | --- | --- |
| Student | `msofia` | `123456` |
| Teacher | `pcarlos` | `123456` |
| Admin | `admin` | `admin123` |

## Funcionalidades disponibles

- **Student:** sesión, dashboard, cursos, Course Detail LMS, materiales, progreso, asistencia LMS/QR, inteligencia derivada, recomendaciones, Tutor/RAG y logout.
- **Teacher:** sesión, cursos propios, estudiantes, Course Detail, materiales, evaluaciones LMS, asistencia, analítica, cierre y cambio seguro de usuario.
- **Admin:** sesión, overview, métricas agregadas del LMS, cierre y cambio seguro de usuario.
- **PWA:** manifiesto, iconos, Service Worker y shell offline básico. Las respuestas privadas `/api/*` no se precachean.

## Inteligencia, recomendaciones y Tutor/RAG

- Intelligence y Recommendations son motores deterministas de reglas que consumen evidencia LMS normalizada. No son ML ni predicción institucional.
- Los valores faltantes se mantienen como `null` o `INSUFFICIENT_DATA`.
- Tutor/RAG consulta conocimiento local autorizado asociado a cursos LMS. No usa un modelo externo ni envía datos a terceros.
- Ninguna de estas capas modifica notas oficiales, asistencia oficial o matrícula.

## Seguridad actual

- Sesiones opacas persistentes en PostgreSQL con token almacenado como hash.
- Cookie `HttpOnly`, `SameSite=Lax`, expiración de 8 horas y revocación mediante logout.
- Roles y pertenencia de curso se resuelven desde backend; headers de identidad/rol del cliente no son autoridad.
- CORS local explícito con credenciales.

Estas medidas son adecuadas para el alcance LMS local DEMO. No sustituyen SSO, controles CSRF completos, rate limiting, auditoría operativa, TLS de producción ni gestión institucional de secretos.

## PWA

La caché actual es `ubo-academic-hub-v204`, el asset principal es `app.js?v=154` y la hoja de estilos vigente es `styles.css?v=132`. Release 1.0 v204 incorpora navegación interna con `pushState`/`popstate`, soporte para el gesto Atrás de Android, historial entre vistas y tarjetas de accesos rápidos responsive. Estos flujos fueron validados en un dispositivo móvil real. La corrección final de Fase 2.54 mantiene el contenido del shell Student por encima de la navegación inferior y del asistente, respetando safe-area y los viewports 390×844, 768×1024 y 1920×1080. El favicon raíz reutiliza la identidad visual existente. Si se actualizan assets precacheados, se debe revisar el grafo ESM y el Service Worker antes de cambiar versión. No incorporar API privada ni UniEcosystemCore al precache.

En Course Detail, `404 COURSE_IDENTITY_NOT_FOUND` significa que el curso DEMO no posee identidad LMS confirmada y activa el fallback DEMO controlado. No se crean UUIDs ni datos LMS ficticios. La observabilidad visual de esos HTTP 404 queda como revisión posterior; no se presenta como un fallo funcional del Course Detail.

## Pruebas disponibles

```powershell
# Frontend, desde raíz
node --test tests/*.test.js

# Backend
cd backend
npm test

# Core separado
cd ..\..\UniEcosystemCore
npm test
npm run check
```

También revisar sintaxis JavaScript y `git diff --check` antes de cualquier entrega posterior.

## Integración institucional futura

Antes de implementar un adapter institucional, leer:

- `docs/AUDIT/INSTITUTIONAL_INTEGRATION_CONTRACT_2_48.md`
- `docs/AUDIT/INSTITUTIONAL_INTEGRATION_READINESS_2_49.md`

UBO deberá proporcionar contrato de identidad, mecanismo SSO/IdP, identificadores estables, usuarios, cursos, períodos, matrícula, datos académicos, asistencia, ambiente QA, reglas de autorización/actualización y responsable técnico. No inventar URLs, APIs, tokens, períodos, estados, identificadores ni reglas de precedencia.

## Fuera del alcance de esta entrega

- SSO e identidad institucional real.
- Fuentes oficiales de matrícula, notas, asistencia y cursos.
- Sincronización institucional.
- Datos personales o académicos reales.
- Backend productivo, observabilidad, alta disponibilidad, backups y CI/CD institucional.
- Licencia pública: el repositorio no contiene `LICENSE`; definirla antes de publicación externa.

## Consistencia documental

El README ofrece el resumen de instalación y alcance actual; este handover conserva el procedimiento operativo y las restricciones de transferencia. Ambos documentos describen el mismo estado: LMS local con frontend PWA, API Express y PostgreSQL local, sin integración institucional real.
