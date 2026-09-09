# Auditoría PWA Profesor/Admin — Fase 1.44

## A. Problema

El shell podía recuperar HTML aislado de Profesor/Admin mientras sus módulos ESM no estaban disponibles. Como consecuencia, los renderizadores no se ejecutaban y permanecían los placeholders iniciales.

## B. Evidencia

- Bajo el shell anterior, los entrypoints `teacher-dashboard.js` y `admin-dashboard.js` reportaron `net::ERR_FAILED`.
- Un servidor estático local sirvió ambos como `text/javascript`; los dos paneles hidrataron correctamente online.
- Todos los imports existen y superan `node --check`.
- Sus servicios entregan los datos esperados; el defecto no era de datos, DOM, rutas relativas ni sintaxis.
- Una navegación offline nueva a Admin con cache v112 retornó el fallback genérico `index.html`.

## C. Service Worker anterior

- Cache: `ubo-academic-hub-v112`.
- Install: `cache.addAll()` del shell estudiantil, configuración, manifest e íconos.
- Activate: elimina caches distintos del vigente y ejecuta `clients.claim()`.
- Fetch documento: network-first, cachea una respuesta online y ante error devuelve el request cacheado o `index.html`.
- Fetch de recursos: cache-first y después red.

La estrategia no incluía assets de Profesor/Admin, por lo que no existía una garantía offline de sus entrypoints ni imports transitivos.

## D. Grafo Profesor

```text
teacher-dashboard.html / CSS
  -> teacher-dashboard.js
     -> modules/professor/dashboard.js
     -> course-service, professor-service, student-service
     -> data/users, data/courses, data/professors, data/students
     -> data/university/courses, rooms, schedules
```

12 módulos JavaScript y sus HTML/CSS correspondientes.

## E. Grafo Admin

```text
admin-dashboard.html / CSS
  -> admin-dashboard.js
     -> admin-service, administrative-action-service
     -> professor-service, student-service, core/permissions
     -> data/users, data/professors, data/students
     -> data/university/analytics, careers, courses, rooms, schedules
```

14 módulos JavaScript y sus HTML/CSS correspondientes.

## F. Assets faltantes

El manifiesto previo no incluía los 22 assets únicos de ambos grafos: 4 documentos/hojas CSS y 18 módulos JavaScript. Los assets se agregaron como `DEMO_SHELL_ASSETS` en v113.

## G. Scope

`service-worker.js` está en la raíz, por lo que su scope por defecto cubre `/modules/professor/` y `/modules/admin/`. No se detectó un problema de scope.

## H. MIME / ESM

El servidor estático de validación respondió los entrypoints con `Content-Type: text/javascript`. Las rutas relativas y extensiones resuelven correctamente; no se detectaron imports circulares ni inexistentes.

## I. Estrategia de cache elegida

Se conserva la estrategia mínima existente:

- Install atómico con `cache.addAll()` del shell estudiante y grafos demo.
- Recursos cache-first.
- Documentos network-first con fallback offline.
- Fallback específico por pathname para Profesor/Admin; otros documentos mantienen `index.html`.

No se cambió a runtime caching ni stale-while-revalidate. El precache completo es la opción más consistente para los grafos demo actuales, pequeños y estáticos.

## J. Reproducción

1. Con v112 y servidor no disponible, una navegación Admin con query no cacheada devolvió `index.html`.
2. Con servidor online, Profesor y Admin hidrataban correctamente, demostrando que sus módulos y datos eran válidos.
3. Tras instalar v113 y detener el servidor, navegaciones nuevas con query a Profesor/Admin hidrataron correctamente desde cache.

## K. Causa raíz

Cache incompleto más fallback genérico de documentos. El service worker podía servir el documento o el shell estudiante, pero no garantizaba los módulos ESM necesarios para hidratar las demos.

## L. Corrección

Se incrementó el cache a `ubo-academic-hub-v113`, se añadió `DEMO_SHELL_ASSETS` con los 22 assets únicos y se agregó `OFFLINE_DOCUMENTS` para devolver el documento demo correcto por pathname. No se tocaron módulos, datos, Career, Room, Core, usuarios ni credenciales.

## M. Pruebas online

Con servidor estático online:

- Estudiante: Inicio hidratado con Sofía y carrera.
- Profesor: Carlos Pérez, departamento, resumen y dos cursos visibles.
- Admin: Administrador UBO, métricas, gestión y estadísticas visibles.
- Consola: sin errores/warnings observados.

## N. Pruebas offline

Después de precache v113 y con el servidor detenido:

- Estudiante: recarga y navegación nueva correctas.
- Profesor: navegación nueva con query, hidratada correctamente.
- Admin: navegación nueva con query, hidratada correctamente.

Una instalación totalmente nueva sin conexión no puede instalar un service worker por definición; requiere una primera carga online.

## O. Actualización

v113 instala un cache nuevo de forma atómica. Solo tras completarse instala/activa; la activación elimina caches anteriores y reclama clientes. La validación desde v112 a v113 confirmó el nuevo fallback por pathname usando URLs únicas offline.

## P. Rollback

No se debe reutilizar el nombre `v112`. Si v113 requiere reversión, publicar una nueva versión de cache con el manifiesto anterior aprobado, por ejemplo v114, y ejecutar las pruebas online/offline. El rollback no afecta datos académicos, sesión ni flags.

## Q. Riesgos y recomendación

Los grafos deben mantenerse actualizados al agregar nuevos imports. Para la Fase 1.45 se recomienda introducir una prueba estática que compare imports ESM de los entrypoints demo con el manifiesto de precache. No integrar roles al router estudiantil como parte de esta tarea.
