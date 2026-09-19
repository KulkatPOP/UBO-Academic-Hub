# Fase 2.52 — Refinamiento visual de Dark Mode

## Problema identificado

El modo oscuro ya tenía variables y overrides, pero varias reglas específicas definidas posteriormente conservaban fondos y bordes de Light Mode. El caso comprobado era `.teacher-empty-state`; también existían tarjetas Student con bordes claros heredados por selectores específicos de `#home`.

## Corrección aplicada

- Se definió una jerarquía de superficies exclusiva de `html[data-theme="dark"]`:
  - fondo: `#101a27` / `#171a22`;
  - tarjeta: `#1d212b`;
  - superficie elevada: `#242936`;
  - borde: `rgba(255,255,255,.08)`;
  - campos: `#151b25`.
- Se cubrieron tarjetas, listas, estados vacíos, formularios, navegación e inputs de Student.
- Se ajustaron superficies del Dashboard y Course Detail de Teacher, incluyendo material, progreso, asistencia, analítica y formularios.
- Se ajustaron métricas, gestión, actividad, recomendaciones y operaciones del Dashboard Admin.
- Se conservaron los colores semánticos de riesgo y acento; solo se adaptaron sus superficies a contraste oscuro.

## Light Mode y accesibilidad

Todas las reglas visuales nuevas están limitadas a `html[data-theme="dark"]`. No se modificaron reglas de Light Mode ni estructura, contenido, eventos o lógica. Se mantienen `:focus-visible`, contraste de texto claro y placeholders visibles; se añadió tratamiento coherente de autofill en Dark Mode.

## PWA

Se actualizó el cache a `ubo-academic-hub-v195` y las referencias de CSS a `styles.css?v=127`, `teacher-dashboard.css?v=2`, `teacher-course-detail.css?v=5` y `admin-dashboard.css?v=2`. No se cambió la estrategia del Service Worker ni se añadieron rutas privadas al precache.

## Comprobación visual realizada

| Rol / vista | Dark Mode | Superficies verificadas | Viewports sin overflow horizontal |
| --- | --- | --- | --- |
| Student / Dashboard | Activo | fondo, tarjetas académicas y formularios; se verificó el stylesheet v127 y los valores de tarjetas Student en Chrome | 390×844, 768×1024, 1920×1080 |
| Teacher / Dashboard | Activo | tarjetas de curso, riesgo y estado vacío | 390×844, 768×1024, 1920×1080 |
| Teacher / Course Detail | Activo | resumen, alumnos, materiales, formularios y analítica | 390×844, 768×1024, 1920×1080 |
| Admin / Dashboard | Activo | métricas, gestión, estadísticas, riesgo y operaciones | 390×844, 768×1024, 1920×1080 |

Los tres tamaños evaluados mantuvieron `scrollWidth <= innerWidth`. La consola no registró errores durante las pruebas visuales.

## Validaciones técnicas

- Frontend: `node --test tests/*.test.js` — **113/113 aprobadas**.
- Backend: `npm test` en `backend/` — **51/51 aprobadas**.
- Sintaxis: `node --check` sobre todos los JavaScript fuera de `node_modules` — **sin errores**.
- Core: `npm test` y `npm run check` — **aprobados**.
- PWA/ESM: validaciones incluidas en la suite — **aprobadas**; cache `ubo-academic-hub-v195`.
- Integridad: `git diff --check` — **sin errores** (solo advertencias informativas de conversión LF/CRLF en archivos preexistentes).
- No se realizó commit, push ni deploy.

Marcadores de cierre:

`DARK_MODE_SURFACES_HARMONIZED` · `DARK_MODE_CARDS_OK` · `DARK_MODE_LMS_OK` · `DARK_MODE_STUDENT_OK` · `DARK_MODE_TEACHER_OK` · `DARK_MODE_ADMIN_OK` · `LIGHT_MODE_PRESERVED` · `RESPONSIVE_PRESERVED` · `ACCESSIBILITY_PRESERVED` · `REGRESSIONS_OK` · `CORE_UNMODIFIED`

## Alcance preservado

No se modificaron servicios, API, backend, PostgreSQL, sesiones, datos, lógica LMS, Intelligence, Recommendations, Tutor/RAG ni UniEcosystemCore. No hubo commit, push ni deploy.
