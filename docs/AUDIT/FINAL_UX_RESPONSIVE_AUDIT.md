# Auditoría UX responsive y flujo completo — Fase 1.94

Fecha: 2026-09-11.

## Alcance

Se revisaron los estilos, markup, rutas y pruebas de la aplicación Student, los shells aislados Teacher/Admin, accesibilidad básica y contrato PWA. No se modificó lógica académica, Core, arquitectura ni flags Core.

## Pantallas y responsive revisados

| Área | 390 px | 768 px | 1440 px | Resultado |
| --- | --- | --- | --- | --- |
| Login / shell Student | Sin overflow horizontal | Sin overflow horizontal | Sin overflow horizontal | OK |
| Navegación inferior y área segura | CSS con padding inferior de contenido y `safe-area-inset-bottom` | Shell centrado | Shell amplio y navegación acotada | OK por revisión estática y tests |
| Tarjetas y formularios Student | Grillas se reducen a una o dos columnas según breakpoint | Dos columnas donde corresponde | Cuadrículas ampliadas | OK por reglas responsive |
| Teacher y Admin | Shelles aislados incluidos en el grafo PWA/ESM | Incluidos | Incluidos | OK por pruebas de shell e imports |

La inspección runtime de `http://localhost:3000` confirmó `scrollWidth === clientWidth` para 390 px, 768 px y 1440 px. No se detectaron tarjetas, botones o controles visibles fuera del viewport en la pantalla de acceso.

## Flujos funcionales

| Flujo | Evidencia | Estado |
| --- | --- | --- |
| Student: login, Inicio, cursos, notas, asistencia, material, avisos y alertas | Suite UBO: sesiones demo, guards, Student grades, attendance, materials, announcements, alerts y resumen | OK |
| Teacher: dashboard, cursos, material, notas, asistencia y avisos | Suite UBO: dashboard summary y servicios de material, notas, asistencia y anuncios | OK |
| Admin: dashboard, métricas y gestión | Suite UBO: admin dashboard summary, métricas, aislamiento y degradación | OK |

El navegador local redirige correctamente un acceso directo al shell Teacher sin identidad demo hacia el login: el guard de ruta está activo. La automatización local no pudo persistir escritura en los campos de login, por lo que la interacción visual autenticada se respaldó con la suite funcional automatizada, que pasó completa.

## Accesibilidad

- Inputs principales están asociados a `label`; los estados de error usan `role="alert"` y resultados usan `role="status"`.
- Los botones iconográficos principales exponen `aria-label` (asistente, contraseña, minimizar/cerrar chat).
- Las acciones generadas dinámicamente conservan elementos `button` y atributos `dataset`, con delegación de eventos existente.
- Existen foco visual y reglas de reducción de movimiento mediante `prefers-reduced-motion` y el ajuste de interfaz disponible.
- Las imágenes/iconos PWA se declaran como recursos PNG con tamaños y propósito `maskable`.

Pendiente recomendado: una pasada manual con lector de pantalla y navegación exclusiva con teclado en un navegador convencional antes de producción.

## PWA

### Corrección aplicada

Se detectó que el hardening de `app.js` no había actualizado el identificador de recurso precacheado. Para evitar que una instalación existente mantenga un shell JavaScript anterior:

- `index.html`: `app.js?v=116` → `app.js?v=117`.
- `service-worker.js`: caché `ubo-academic-hub-v141` → `ubo-academic-hub-v142`.
- `service-worker.js`: recurso precache `app.js?v=116` → `app.js?v=117`.

La recarga de `localhost:3000` confirmó que el shell solicita `app.js?v=117`.

### Validación

- Manifest presente, con `start_url`, `scope`, modo standalone e iconos 192/512.
- Service Worker registra `install`, `activate` y `fetch`, y contiene fallback de documento offline.
- `tests/pwa-esm-precache.test.js` valida el grafo ESM, precache de Selector/Teacher/Admin, ausencia de ciclos y exclusión de UniEcosystemCore del PWA.

## Problemas encontrados y correcciones

| Problema | Severidad | Corrección |
| --- | --- | --- |
| Shell PWA podía conservar `app.js?v=116` después de cambios de hardening | Media | Bump coherente de URL de recurso y nombre de caché a `v142` |
| Verificación asistida de login no persistió texto en el navegador automatizado | Herramienta | No es defecto confirmado de la aplicación; cubierto por suite funcional. Requiere comprobación manual opcional |

No se aplicaron cambios CSS adicionales: no hubo un defecto visual reproducible que justificara alterar el sistema responsive estable.

## Calidad y regresiones

- Sintaxis de todos los JavaScript UBO: OK.
- Hardening test: OK.
- Suite UBO completa: OK.
- PWA/ESM: OK.
- UniEcosystemCore: `npm test` y `npm run check` OK.
- `git diff --check`: OK; quedan solo avisos existentes de normalización LF/CRLF.
- Core permanece sin modificaciones; las flags de Core Session, Identity y Authorization siguen desactivadas.

## Resultado

- `UX_AUDIT_COMPLETE`
- `RESPONSIVE_OK`
- `STUDENT_FLOW_OK`
- `TEACHER_FLOW_OK`
- `ADMIN_FLOW_OK`
- `ACCESSIBILITY_PROGRESS`
- `REGRESSIONS_OK`
- `PWA_OK`
- `CORE_UNMODIFIED`
