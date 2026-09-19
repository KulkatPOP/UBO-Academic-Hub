# UBO Academic Hub — Release Manifest 1.0

## Identificación

- **Nombre:** UBO Academic Hub
- **Versión:** Release 1.0
- **Tipo:** LMS local DEMO preparado documentalmente para una futura integración institucional.
- **Fecha de preparación:** 2026-09-19
- **Paquete:** `C:\Users\shari\Desktop\UBO-Academic-Hub-Release-1.0.zip`.

## Componentes incluidos

- Frontend PWA con HTML, CSS y ES Modules.
- Backend Express local.
- PostgreSQL local: migraciones y seed DEMO.
- LMS para Student, Teacher y Admin.
- Capas locales de Intelligence, Recommendations y Tutor/RAG.
- Servicios, módulos, configuraciones de ejemplo, documentación y suites de prueba.

## Roles y datos

- **Student**, **Teacher** y **Admin**.
- Datos y credenciales exclusivamente DEMO/LMS local.
- Credenciales documentadas: `msofia` / `123456`, `pcarlos` / `123456` y `admin` / `admin123`.
- Las credenciales DEMO no corresponden a cuentas institucionales UBO y no deben reutilizarse fuera de un entorno local.

## Frontera institucional

La integración con sistemas institucionales reales de UBO **NO ESTÁ IMPLEMENTADA**. Está preparada documentalmente en:

- `docs/AUDIT/INSTITUTIONAL_INTEGRATION_CONTRACT_2_48.md`
- `docs/AUDIT/INSTITUTIONAL_INTEGRATION_READINESS_2_49.md`

El paquete no contiene SSO, fuentes institucionales, datos reales de UBO ni conectores hacia sistemas externos.

## PWA

- Service Worker: `ubo-academic-hub-v200`.
- Hoja de estilos principal: `styles.css?v=131`.
- El precache contiene shells y módulos estáticos necesarios.
- No se precachean rutas privadas `/api/*`.

La corrección visual final de Fase 2.54 usa las superficies y variables
existentes del shell Student para mantener el contenido sobre la navegación
inferior y el asistente, sin alterar el modo claro ni los shells Teacher/Admin.

## Validaciones de preparación

| Área | Resultado real |
| --- | --- |
| Frontend | `node --test tests/*.test.js`: 113 aprobadas, 0 fallidas |
| Backend | `npm test`: 51 aprobadas, 0 fallidas |
| Sintaxis JavaScript | `node --check` sobre JavaScript fuera de `node_modules`: sin errores |
| UniEcosystemCore | `npm test` y `npm run check`: aprobados |
| PWA/ESM | Pruebas existentes incluidas en frontend: aprobadas |
| Integridad de diff | `git diff --check`: sin errores de whitespace |

## Exclusiones del paquete

- `.git/`, `node_modules/` y cualquier `.env` real.
- Logs, cachés, archivos temporales, backups y archivos del sistema.
- Cookies, tokens, secretos reales, datos personales reales y bases de datos locales.

`backend/.env.example` se conserva como configuración de desarrollo DEMO; no sustituye una gestión de secretos de producción.

## Licencia

`LICENSE_STATUS = NOT_DEFINED`. No se inventó ni añadió una licencia.

## Integridad del paquete

- La evidencia externa del contenedor final registra tamaño, cantidad de archivos, SHA-256, apertura y extracción. El contenido de este manifiesto permanece estable dentro del ZIP para no invalidar el checksum del propio archivo.
- El hash de un archivo ZIP no se inserta dentro de ese mismo ZIP: hacerlo alteraría el artefacto y volvería a invalidar el checksum. El SHA-256 definitivo se registra fuera del artefacto en `docs/AUDIT/FINAL_RELEASE_REBUILD_1_0.md`, junto con la comprobación física de apertura y extracción.
- El ZIP incluye este manifiesto con versión PWA, versión CSS, alcance, exclusiones y resultados de validación; la integridad del contenedor se verifica mediante el hash externo del archivo final.

### Evidencia externa de reconstrucción final

- **Archivo:** `C:\Users\shari\Desktop\UBO-Academic-Hub-Release-1.0.zip`
- **Fecha de verificación:** 2026-09-19
- **Tamaño:** 1,220,479 bytes
- **Entradas:** 525
- **SHA-256:** `2E3C7632A1136A8CE5E18B8ACCE4F2F214A5E5A94277DFBCB79070C3A63559AD`
- **Verificación:** apertura con `System.IO.Compression.ZipFile`, listado independiente con `tar.exe` y extracción temporal correcta con `Expand-Archive`.
- **Estructura comprobada:** `README.md`, `backend/`, `data/`, `docs/`, `services/` y `tests/`. Las migraciones y seeds se mantienen únicamente bajo `backend/src/database/`; no existe una carpeta `database/` artificial en la raíz.

## Estado Git

El repositorio fuente tenía modificaciones y archivos no rastreados legítimos de fases previas al preparar este manifiesto. No se descartaron, alteraron ni confirmaron mediante commit. No hubo push ni deploy.
