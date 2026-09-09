# Auditoría del shell Profesor/Admin — Fase 1.43

## A. Problema

En el shell local `http://localhost:3000`, las páginas aisladas `modules/professor/teacher-dashboard.html` y `modules/admin/admin-dashboard.html` pueden mostrar su HTML inicial sin hidratar. Profesor conserva títulos y secciones vacías; Admin conserva `Cargando…` y grids vacíos.

## B. Evidencia

1. Ambos HTML contienen un único entrypoint ESM: `./teacher-dashboard.js` y `./admin-dashboard.js`.
2. Cada entrypoint llama directamente a su renderizador al final del archivo: `renderTeacherDashboard()` y `renderAdminDashboard()`. No dependen de un evento de router, sesión o login.
3. La resolución estática de ambos grafos encontró todos sus imports locales: 7 archivos para Profesor y 11 para Admin. `node --check` es correcto.
4. Sus servicios devuelven datos válidos: Carlos Pérez con 2 cursos, y Administrador UBO con resumen/gestión institucional.
5. Bajo el navegador del shell local, las solicitudes directas de ambos entrypoints reportaron `net::ERR_FAILED` mientras sus documentos seguían disponibles.
6. `service-worker.js` precachea solo el shell estudiantil (`index.html`, `app.js?v=112`, estilos, configuración, manifest e íconos); no incluye los entrypoints ni los grafos ESM de Profesor/Admin.

## C. Comparación

| Área | Estudiante | Profesor | Admin |
|---|---|---|---|
| Login/sesión | Integrado en `app.js` | Demo aislada, sin login | Demo aislada, sin login |
| Router | `showScreen()` | Navegación directa del selector | Navegación directa del selector |
| Render inicial | `renderScreen()` | `renderTeacherDashboard()` directo | `renderAdminDashboard()` directo |
| Datos | Legacy/app | Servicios puros correctos | Servicios puros correctos |
| DOM | Hidratado | HTML presente; script no disponible en shell | HTML presente; script no disponible en shell |
| Estado observado | Funciona | Secciones vacías | `Cargando…` y grids vacíos |

El selector demo usa `window.location.assign()` a HTML aislados. No existe todavía un flujo real `Login -> Profesor/Admin`; esa separación es intencional y no representa una falla del router estudiantil.

## D. Causa raíz

**Clasificación: shell/PWA + disponibilidad de imports ESM.** Cuando el shell local queda sin una red que sirva módulos, puede recuperar un documento cacheado, pero no puede hidratarlo porque los entrypoints y sus dependencias no están precacheados. El renderizador nunca se ejecuta; por eso los placeholders originales permanecen visibles.

No se detectó fallo de datos, DOM, sesión, router, orden de ejecución interno o sintaxis. No se aplicó corrección: precachear estas pantallas requiere definir y validar un manifiesto completo de cada grafo ESM, versión de caché y pruebas online/offline; excede una corrección mínima de esta fase.

## E. Relación con Career

No existe referencia de Profesor/Admin a `USE_CANONICAL_CAREER`, `career-migration-bridge` ni al Career adapter. Career OFF y Career ON no forman parte de sus grafos de módulos. El problema es independiente del piloto Career.

## F. Impacto

La aplicación estudiante continúa operativa. Los datos y servicios demo Profesor/Admin se mantienen disponibles por Node; el impacto se limita a las interfaces aisladas cuando el shell no puede recuperar sus módulos.

## G. Corrección realizada

Ninguna. No se modificaron PWA, service worker, módulos, datos, Career, Room, autenticación ni rutas.

## H. Riesgos

- Las demos aisladas no son offline-ready.
- Actualizar el service worker sin un manifiesto de dependencias puede servir versiones parciales.
- Profesor/Admin no son todavía experiencias autenticadas de la aplicación principal.

## I. Recomendación

Fase posterior: crear una auditoría exclusiva de assets PWA y decidir si las demos deben ser offline-capable. Si se aprueba, precachear por grafo completo, aumentar versión de caché y probar primera carga online, recarga offline y actualización. No integrar roles en `app.js` como parte de esa corrección.
