# QA de seguridad, aislamiento y permisos LMS — Fase 2.41

## Alcance y corrección aplicada

La auditoría encontró una vulnerabilidad crítica: las rutas privadas trataban el encabezado HTTP `x-user-id` como identidad. Un cliente podía falsificar ese valor y pasar por cualquier usuario conocido.

Se sustituyó esa frontera por una sesión DEMO opaca, en memoria, creada por `POST /api/auth/login`. La sesión se entrega exclusivamente como cookie `HttpOnly`, `SameSite=Lax`, con vigencia de ocho horas. El middleware de rutas privadas la resuelve antes de los controladores, descarta `x-role` y sobrescribe cualquier `x-user-id` del cliente con la identidad validada de la sesión.

No se agregaron tablas, endpoints paralelos, JWT, Core ni datos LMS. Las credenciales no se incluyen en las respuestas ni en `uboAcademicSession`.

## Identidades y HTTP real

Se ejecutó una matriz HTTP contra PostgreSQL activo en un servidor efímero y, después, se verificó el servidor local en `http://localhost:3001`.

| Caso | Resultado |
| --- | --- |
| Login Sofía, Carlos y Admin | `200`; respuesta pública solamente |
| Cookie de sesión | Presente y `HttpOnly` |
| Sin cookie + `x-user-id` de Admin | `401 AUTHENTICATION_REQUIRED` |
| Sofía + query/header `role=ADMIN`, `userId=Admin` | conserva el ámbito Student; overview Admin `403` |
| Sofía → detalle de Bases de Datos | `200` |
| Sofía → curso inexistente | `404 COURSE_NOT_FOUND` |
| Sofía → estudiantes del curso | `403 TEACHER_ROLE_REQUIRED` |
| Sofía → inteligencia, recomendaciones, historial Tutor, notificaciones con query ajena | `200`, contexto resuelto por cookie |
| Carlos → cursos y estudiantes de Bases de Datos | `200` |
| Carlos → inteligencia Student / overview Admin | `403` |
| Admin → overview | `200`, sólo métricas agregadas |

No hay fixture real de un curso ajeno a Sofía ni de un segundo docente; esos dos `403` se mantienen cubiertos por los tests de servicio/ruta existentes. No se crearon fixtures artificiales. La base local tampoco contiene mensajes o notificaciones persistidos para inspeccionar cuerpos cruzados; los tests verifican los filtros por `recipient_reference`/`sender_reference` y `user_reference`.

## Datos protegidos

- `/api/courses/:id/students` entrega sólo `id`, `name` y `role` de alumnos al docente propietario.
- El overview Admin expone conteos agregados, sin cuerpos de mensajes, entregas individuales, tokens ni contraseñas.
- Tutor, progreso, inteligencia y recomendaciones usan la identidad de la sesión y las relaciones LMS del backend; query/body no seleccionan al estudiante.
- Las notificaciones validan `user_reference` antes de marcar lectura.
- El Service Worker precachea únicamente recursos estáticos; no lista `/api/*` y no cachea respuestas privadas.

## Pruebas automatizadas

- Se añadió `backend/test/security-isolation.test.js`: rechaza un UUID falsificado sin cookie y confirma que una cookie Student prevalece sobre encabezados Admin falsificados.
- `backend npm test`: 51 pruebas aprobadas.
- El modo `node --test` conserva un adaptador limitado para fixtures legacy no UUID; no se activa en el proceso HTTP de desarrollo ni en producción.

## Limitaciones y siguiente paso

La sesión es intencionalmente DEMO y reside en memoria: se pierde al reiniciar el backend y no implementa revocación distribuida ni SSO. Antes de producción debe reemplazarse por identidad institucional/OAuth/SAML o sesiones persistentes con protección CSRF y rotación.

En Windows, el valor por defecto de PostgreSQL se ajustó a `127.0.0.1` para evitar reinicios de conexión observados con la resolución de `localhost`; `DB_HOST` continúa siendo configurable.
