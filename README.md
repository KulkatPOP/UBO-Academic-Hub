# UBO Academic Hub

UBO Academic Hub es un LMS local para flujos académicos demostrativos de Student, Teacher y Admin.

> El proyecto es un LMS local funcional con PostgreSQL, frontend PWA, backend Express, inteligencia académica determinista, recomendaciones y Tutor/RAG contextualizado.

La integración con sistemas institucionales reales de UBO no forma parte de esta entrega. Su implementación posterior requiere los contratos, mecanismos de autenticación, identificadores y fuentes de datos que proporcione la institución.

## Alcance actual

- **Student:** sesión, dashboard, cursos, Course Detail LMS, materiales, progreso, asistencia LMS/QR, recomendaciones, Tutor/RAG y cierre de sesión.
- **Teacher:** cursos propios, estudiantes, Course Detail, materiales, evaluaciones LMS, asistencia, avisos, analítica y cierre de sesión.
- **Admin:** sesión, overview y métricas agregadas del LMS.
- **PWA:** manifiesto, iconos, Service Worker y shell offline básico.
- **Inteligencia académica:** reglas deterministas, recomendaciones y consulta de conocimiento local por curso. No usa modelos IA externos ni modifica registros académicos oficiales.

Los datos, métricas, usuarios y credenciales de esta entrega son DEMO o locales. No representan datos institucionales reales.

## Arquitectura

```text
Frontend estático (ES Modules + PWA, puerto 3000)
  → API Express local (puerto 3001)
  → PostgreSQL local en Docker (puerto 5432)
```

El frontend utiliza flujos API-first para recursos LMS y conserva fallback DEMO/local cuando la API no está disponible. UniEcosystemCore permanece separado del proyecto y sus flags de integración continúan desactivados.

```text
.
├── backend/                 # API Express, PostgreSQL local, migraciones y seeds DEMO
├── config/                  # Configuración institucional DEMO
├── core/                    # Infraestructura futura aislada
├── data/                    # Datos, mappings y modelos DEMO
├── docs/                    # Auditorías, arquitectura y handover
├── modules/                 # Interfaces por rol y módulos DEMO
├── services/                # Servicios frontend, API adapters y acciones
├── tests/                   # Pruebas frontend y de arquitectura
├── index.html, app.js       # Aplicación Student
├── manifest.json            # Metadatos de instalación PWA
└── service-worker.js        # Precache y soporte offline básico
```

## Requisitos locales

- Node.js y npm compatibles con las dependencias declaradas en `backend/package.json`.
- Docker Desktop con Docker Compose para PostgreSQL local.
- Python u otro servidor HTTP estático para el frontend.

El backend no declara actualmente una versión mínima mediante `engines`; verificar compatibilidad con las dependencias antes de cambiar de entorno.

## Instalación y ejecución local

### 1. PostgreSQL y API

Desde la raíz del proyecto:

```powershell
cd backend
npm install
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm start
```

La configuración de ejemplo está en `backend/.env.example`. No crear, versionar ni compartir un archivo `.env` con secretos reales. Las migraciones y seeds se deben ejecutar solo contra una base local de desarrollo o QA.

Comprobación de servicios:

```powershell
Invoke-WebRequest http://localhost:3001/api/health -UseBasicParsing
Invoke-WebRequest http://localhost:3001/api/database/health -UseBasicParsing
```

### 2. Frontend

En otra terminal, desde la raíz:

```powershell
python -m http.server 3000
```

Abrir [http://localhost:3000](http://localhost:3000). Se requiere HTTP para ES Modules y Service Worker.

## Credenciales DEMO

| Rol | Usuario | Contraseña DEMO |
| --- | --- | --- |
| Student | `msofia` | `123456` |
| Teacher | `pcarlos` | `123456` |
| Admin | `admin` | `admin123` |

Estas credenciales son únicamente DEMO: no son institucionales ni deben reutilizarse fuera del entorno local. La sesión no guarda contraseñas en el frontend.

## PWA y caché

- Caché vigente: `ubo-academic-hub-v203`.
- Hoja de estilos vigente: `styles.css?v=131`.
- Asset principal vigente: `app.js?v=153`.
- Las rutas privadas `/api/*` no forman parte del precache.
- Antes de cambiar el Service Worker, revisar el grafo ESM y los assets incluidos en precache.
- El favicon raíz existe y reutiliza la identidad visual PWA.

Course Detail resuelve la identidad LMS de forma selectiva: Bases de Datos usa LMS cuando la API confirma su identidad; English, IoT y Cyber conservan la vista DEMO cuando la API devuelve `404 COURSE_IDENTITY_NOT_FOUND`. Ese 404 de red es esperado para cursos DEMO sin identidad LMS y queda pendiente de una revisión posterior de observabilidad/consola; no se altera a una respuesta ficticia `200`.

## Seguridad y límites

- Los renderizadores dinámicos usan nodos DOM y `textContent` como patrón de seguridad.
- Las sesiones LMS locales usan cookie `HttpOnly`, `SameSite=Lax`, expiración y revocación mediante logout.
- El backend resuelve roles y pertenencia de curso; headers de identidad del cliente no son autoridad.
- Esto es adecuado para un LMS local DEMO, no para producción institucional.

Fuera de alcance: SSO/OAuth institucional, fuentes oficiales de matrícula/notas/asistencia, sincronización institucional, datos reales, TLS de producción, observabilidad, alta disponibilidad, backups, CI/CD institucional y gestión corporativa de secretos.

## Validación

```powershell
# Frontend, desde la raíz
node --test tests/*.test.js

# Backend
cd backend
npm test

# Sintaxis JavaScript (desde la raíz)
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }

# Core separado
cd ..\..\UniEcosystemCore
npm test
npm run check
```

También ejecutar `git diff --check` antes de una entrega. El frontend raíz no tiene `package.json`; sus pruebas se ejecutan con `node --test`.

## Integración institucional futura

Antes de cualquier integración real, revisar:

- `docs/AUDIT/INSTITUTIONAL_INTEGRATION_CONTRACT_2_48.md`
- `docs/AUDIT/INSTITUTIONAL_INTEGRATION_READINESS_2_49.md`
- `docs/HANDOVER/PROJECT_HANDOVER.md`

La institución deberá proporcionar, como mínimo, el contrato de identidad, SSO/IdP, identificadores estables, datos autorizados, periodos, matrícula, reglas de autorización y actualización, ambiente QA y responsable técnico. No se deben inventar URLs, tokens, identificadores ni reglas institucionales.

## Capturas

Pendiente: agregar capturas verificadas de los flujos Student, Teacher y Admin antes de una publicación pública.

## Licencia

`LICENSE = NOT_DEFINED`. El repositorio no contiene un archivo de licencia; definirlo antes de cualquier publicación externa.
