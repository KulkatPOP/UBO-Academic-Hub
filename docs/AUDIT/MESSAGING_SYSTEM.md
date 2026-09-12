# Comunicación institucional Profesor ↔ Student — modo demo

## Arquitectura

La mensajería usa la fuente local `uboDemoMessages`, administrada por `services/message-service.js`. Cada registro conserva `courseId`, emisor docente, destinatario individual, asunto, contenido, fecha y estado de lectura. No reemplaza los avisos académicos existentes.

## Aislamiento y permisos demo

- Solo el profesor asignado puede enviar o ver mensajes de un curso.
- El envío a «Curso completo» crea un registro individual para cada estudiante inscrito.
- El estudiante solo recibe mensajes dirigidos a su identificador y pertenecientes a cursos donde está inscrito.
- Un estudiante solo puede obtener o marcar como leído sus propios mensajes.

## Alertas

Las alertas académicas demo incorporan `MESSAGE_INFO` para mensajes no leídos. Es una alerta derivada de lectura: no modifica el sistema institucional de alertas ni crea una fuente de datos adicional.

## Limitaciones

Todo el contenido es local y demo: no hay backend, envío externo, adjuntos, notificaciones push, autenticación productiva ni persistencia compartida entre dispositivos. Antes de producción se requiere autorización de servidor, auditoría, moderación y cifrado de datos en tránsito y reposo.
