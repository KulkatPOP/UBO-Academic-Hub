# Corrección Course Detail LMS — 2.36 / 2.36-B

## Causa raíz

`renderLmsCourseDetail` tenía un ternario incompleto en el texto de “Evaluaciones enviadas”. La rama alternativa se añadió sin cambiar indicadores de materiales, pendientes o asistencia.

El error de importación `findInstitutionalDemoUser` no existe en el código actual: `data/users.js` exporta la función y `auth-api-service.js` la importa correctamente para fallback sólo ante error de red. La evidencia apunta a una copia obsoleta servida por cache.

## Service Worker

La lista de precache combinaba `APP_ASSETS` y `DEMO_SHELL_ASSETS` sin deduplicar. Se cambió a `Set` para conservar cada asset único y se actualizó el cache a `ubo-academic-hub-v181`, evitando que el Service Worker reutilice el shell anterior. No se cachean respuestas API privadas.

## Pendiente visual

La validación visual quedó completada en la Fase 2.38. Con el Service Worker
actualizado y el shell recargado, la sesión backend de Sofía resuelve `db` y
renderiza el bloque `Datos del LMS Academic Hub` desde las respuestas LMS.

## Validación 2.36-B

- `node --check` pasó para `app.js`, `data/users.js`, `services/api/auth-api-service.js` y `service-worker.js`.
- La importación ESM de `findInstitutionalDemoUser` se comprobó directamente con el usuario DEMO `msofia`.
- El precache queda deduplicado por `Set`; la prueba PWA/ESM pasó y la recarga del navegador no registró errores ni advertencias de importación o `Cache.addAll`.
- Backend activo: la resolución `db` devuelve `Bases de Datos` / `INF-302` y el LMS entrega 3 materiales, 1 asistencia sobre 2 sesiones (50%) y la recomendación `REVIEW_MATERIAL` con causa `LOW_ATTENDANCE_LMS`.
- Las peticiones LMS autenticadas enviaron únicamente `x-user-id`; no se enviaron contraseña, rol ni `studentId` como autoridad.
- La validación visual completa del bloque LMS se documenta en
  `COURSE_DETAIL_LMS_HYDRATION_2_38.md`.
