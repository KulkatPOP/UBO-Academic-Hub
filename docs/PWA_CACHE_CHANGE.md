# Cambio PWA v113 — Profesor/Admin

## Cambio

`service-worker.js` cambia el cache de `ubo-academic-hub-v112` a `ubo-academic-hub-v113`.

## Motivo

La versión anterior no precacheaba los entrypoints ni dependencias ESM de las vistas demo Profesor/Admin, por lo que una carga offline podía mostrar HTML sin hidratar o devolver el shell estudiantil.

## Alcance

- Se añade `DEMO_SHELL_ASSETS` con HTML, CSS y los 18 módulos únicos de los grafos Profesor/Admin.
- Se añade `OFFLINE_DOCUMENTS` para devolver el documento demo correspondiente ante una navegación offline.
- Se conserva cache-first para recursos y network-first para documentos.

## No modificado

No se modificaron `app.js`, módulos Profesor/Admin, servicios, datos, usuarios, credenciales, Career, Room, Core, manifest ni UI.

## Validación

Profesor y Admin hidrataron online y, después de instalación v113, también desde navegaciones offline nuevas con URL única. Estudiante continuó funcionando offline. La versión anterior v112 no tenía ese comportamiento para una navegación Admin nueva.

## Rollback

Ante una reversión, emitir una nueva versión de cache con el manifiesto previo aprobado; no reutilizar `v112` ni borrar datos locales.
