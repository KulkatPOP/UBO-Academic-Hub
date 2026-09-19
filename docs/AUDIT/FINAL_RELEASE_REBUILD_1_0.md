# Reconstrucción definitiva — Release 1.0

## Alcance

- **Release:** 1.0
- **PWA:** `ubo-academic-hub-v200`
- **CSS:** `styles.css?v=131`
- **Fecha:** 2026-09-19

El paquete se genera desde el estado actual del proyecto, manteniendo su estructura real: `backend/src/database/` es la única ubicación de las migraciones y seeds; no se crea una carpeta `database/` artificial en la raíz.

## Validación previa

| Comprobación | Resultado |
| --- | --- |
| Frontend `node --test tests/*.test.js` | 113 aprobadas, 0 fallidas |
| Backend `npm test` | 51 aprobadas, 0 fallidas |
| Sintaxis JavaScript | 300 archivos comprobados, 0 fallas |
| Core `npm test` y `npm run check` | Aprobados; Core no modificado |
| `git diff --check` | Sin errores de whitespace |

El proyecto raíz no contiene `package.json`; por ello `npm test` y `npm run check` se ejecutan desde `backend/`, que es el único paquete Node del proyecto UBO. Las pruebas del Core se ejecutan en su repositorio separado, sin modificarlo.

## Contenido, seguridad y presentación

El artefacto incluye frontend, PWA, backend, datos, módulos, servicios, documentación, tests y configuración de ejemplo. Excluye `.git/`, `node_modules/`, `.env` reales, logs, cachés, temporales, backups, certificados, claves privadas y secretos.

Las únicas credenciales incluidas son DEMO y están documentadas: `msofia` / `123456`, `pcarlos` / `123456`, `admin` / `admin123`.

Dark Mode incluye los estados vacíos de compromisos, avisos, notas, asistencia y mensajes mediante `--dark-subtle`, `--dark-border` y `--text`; el indicador de nota usa `--dark-elevated`. Las reglas se limitan a `html[data-theme="dark"]`, sin alterar Light Mode. La Fase 2.54 corrigió de forma estructural el espacio del shell Student entre su contenido, el asistente y la navegación inferior. La revisión responsive confirmó ausencia de overflow horizontal en 390×844, 768×1024 y 1920×1080.

## Integridad del ZIP

El paquete final se abre con `System.IO.Compression.ZipFile` y `tar.exe`, se extrae con `Expand-Archive`, y contiene solo rutas relativas directas. La verificación confirma las rutas requeridas y ausencia de entradas excluidas.

El tamaño, cantidad de entradas y SHA-256 se conservan como evidencia externa porque incorporarlos dentro del mismo ZIP modificaría el archivo y cambiaría inevitablemente su checksum. El ZIP sí contiene la versión PWA, CSS, alcance, exclusiones y resultados de validación vigentes antes de empaquetar.

## Evidencia externa de la reconstrucción final

- **Artefacto:** `C:\Users\shari\Desktop\UBO-Academic-Hub-Release-1.0.zip`
- **Tamaño real:** 1,220,479 bytes
- **Entradas reales:** 525
- **SHA-256:** `2E3C7632A1136A8CE5E18B8ACCE4F2F214A5E5A94277DFBCB79070C3A63559AD`
- **Apertura:** correcta con `System.IO.Compression.ZipFile`.
- **Comprobación independiente:** `tar.exe -tf` devolvió las mismas 525 entradas.
- **Extracción:** correcta con `Expand-Archive`; se confirmaron `README.md`, `backend/`, `data/`, `docs/`, `services/` y `tests/`.
- **Base de datos:** se verificó la ubicación real `backend/src/database/`; no se creó ni incluyó un directorio `database/` artificial en la raíz.
- **Exclusiones:** 0 entradas de `.git`, `node_modules`, `.env` real, logs, cachés, temporales, backups o extensiones de claves/certificados.
