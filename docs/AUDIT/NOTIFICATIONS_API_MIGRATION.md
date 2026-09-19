# Notificaciones LMS API-first

Las notificaciones almacenadas en esta capa pertenecen al LMS Academic Hub y no representan notificaciones académicas oficiales de la Universidad.

## Alcance y fuentes

La auditoría encontró dos capas previas: el centro de notificaciones DEMO en `app.js`, derivado de evaluaciones, entregas, asistencia y calendario con el estado de lectura local `uboNotificationState`; y las alertas académicas de sólo lectura de `student-alert-service.js`, incluido `MESSAGE_INFO`. Ambas siguen intactas como fallback y no se migraron masivamente.

La capa LMS persiste únicamente eventos concretos. En esta fase se implementó `MESSAGE`: al enviar un mensaje LMS real, `message-service` crea una notificación mínima para su destinatario. Consultar una API nunca crea notificaciones. Recomendaciones, tutor, asistencia QR y analítica permanecen separados para evitar spam o duplicación.

## Tabla, API y permisos

`011_lms_notifications.sql` crea `lms_notifications`, vinculada a `users_reference(id)`, con tipo, severidad, recurso, lectura y fechas. Sólo admite `MESSAGE` y el recurso `MESSAGE`; las severidades validadas son `INFO`, `WARNING`, `SUCCESS` y `ERROR`.

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

La identidad llega exclusivamente por `x-user-id`; body/query `userId` y `role` no participan en autorización. Una lectura de otra persona responde `403`. Las respuestas declaran `source: "LMS"` y nunca contienen credenciales, tokens o secretos.

## Duplicados, UI y fallback

La clave única `(user_reference, type, resource_type, resource_reference)` evita que el mismo mensaje cree más de una notificación para el mismo destinatario. El frontend usa `notification-api-service` con API-first: cuando responde LMS, el centro existente muestra “Notificaciones LMS”; ante ausencia de sesión, red o API mantiene la lista DEMO/local y sus marcas de lectura.

## Límites

No hay push, correo, WebSocket, notificaciones oficiales UBO ni migración automática de datos locales. El contenido está limitado al mínimo necesario para enlazar al mensaje LMS; no se almacenan notas, asistencia oficial, matrícula, QR tokens ni datos sensibles.
