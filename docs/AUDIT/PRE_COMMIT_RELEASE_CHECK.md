# Pre-commit release check — Fase 1.97

**Estado:** preparado para staging; no se creó commit, push ni despliegue.

## Alcance de inclusión

| Categoría | Incluir | Contenido verificado |
| --- | --- | --- |
| Código de aplicación | Sí | `app.js`, `index.html`, `styles.css`, configuración institucional y módulos por rol. |
| Servicios | Sí | Adaptadores, acciones, analítica y servicios Student, Teacher y Admin. |
| PWA y configuración | Sí | `manifest.json`, `service-worker.js`, iconos y `.gitignore`. |
| Tests | Sí | Pruebas actuales de regresión, seguridad, PWA/ESM y arquitectura. |
| Documentación | Sí | `README.md`, documentación funcional y auditorías bajo `docs/`. |
| Herramientas | Sí | `tools/core-dev-server.mjs`, requerido para el flujo local de Core. |

## Exclusiones

No se identificaron archivos temporales, logs, backups, dependencias instaladas ni archivos del sistema para añadir. `.gitignore` excluye `.env`, `.env.*`, `node_modules/`, logs, temporales, backups y configuraciones locales de IDE/editor.

## Estado previo al staging

- Cambios rastreados: aplicación Student, shells Admin/Teacher, selector demo, PWA, estilos y prueba de precache.
- Archivos no rastreados: documentación, servicios, acciones, adaptadores, vistas demo, herramientas y pruebas generados durante las fases de consolidación.
- No se detectaron archivos de credenciales ni llaves privadas por nombre de archivo; las referencias a secretos encontradas corresponden a documentación y tests.
- La caché PWA vigente es `ubo-academic-hub-v142` y referencia `app.js?v=117`.

## Validaciones requeridas

- Sintaxis de todos los JavaScript mediante `node --check`.
- Suite completa de `tests/*.test.js`, incluidas pruebas PWA/ESM.
- `npm test` y `npm run check` de UniEcosystemCore como validación externa de contratos.
- `git diff --check`.

## Resultado previo al commit

El conjunto está destinado a un primer commit de consolidación único. La única advertencia de Git es la conversión LF→CRLF en archivos existentes; no representa un error de parche. Core no forma parte del staging de UBO y no fue modificado.

**PRE_COMMIT_READY**
