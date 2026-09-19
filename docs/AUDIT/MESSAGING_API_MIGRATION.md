# Migración de mensajería LMS a API

La mensajería pertenece al LMS Academic Hub y no constituye un canal oficial de comunicación institucional.

La fuente previa `uboDemoMessages` y `message-service.js` se conservan como fallback. La nueva ruta es `message-api-service.js` → Express → PostgreSQL `lms_messages`.

Cada mensaje de curso se persiste como una fila por estudiante inscrito: esto conserva aislamiento, consulta de bandeja y `read_at` individual. Los mensajes no usan destinatarios nulos. Límites: asunto 1–120 caracteres y cuerpo 1–2000; los excesos se rechazan.

Endpoints: `GET /api/messages`, `GET /api/messages/unread-count`, `GET /api/messages/:id`, `POST /api/messages/course/:courseId`, `POST /api/messages/:id/read`.

La identidad se resuelve sólo desde `x-user-id` y `users_reference`. El backend ignora sender, recipient, role o course del cuerpo para fines de autorización. Un profesor debe ser dueño del curso; un estudiante sólo puede leer/marcar sus filas; ADMIN no obtiene mensajes privados automáticamente.

Los mensajes no contienen contraseñas. El contenido es texto y las interfaces existentes lo renderizan con `textContent`. Los mensajes no leídos pueden derivar `MESSAGE_INFO`; al marcar leído se persiste `read_at` y la alerta puede recalcularse sin duplicar fuentes.
