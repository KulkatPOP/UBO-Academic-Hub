# QA integral Admin post-sesión persistente — Fase 2.46

## Entorno

- Frontend local: `http://localhost:3000`.
- API local: `http://localhost:3001`.
- `GET /api/health`: `200`, arquitectura `intelligent-layer`.
- `GET /api/database/health`: base de datos `connected`.
- Se utilizó exclusivamente el perfil ADMIN DEMO existente. No se muestran credenciales ni cookies.

## Corrección mínima aplicada

La auditoría detectó que el botón Admin de cierre de sesión limpiaba el estado local, pero no revocaba la cookie HttpOnly en la API. Se añadió `logout()` al cliente de autenticación existente y el dashboard Admin lo espera antes de limpiar la sesión local y redirigir. No se creó una API, tabla ni arquitectura adicional.

El cambio necesitó invalidar recursos PWA relacionados: `admin-dashboard.js?v=3`, `auth-api-service.js?v=2` y caché `ubo-academic-hub-v190`. El primer intento de corrección expuso un módulo cacheado sin la nueva exportación; se resolvió versionando la dependencia, sin cambiar datos ni contratos backend.

## Login, sesión, recarga y reinicio

| Verificación | Resultado | Evidencia |
|---|---|---|
| Login ADMIN por UI | OK | Dashboard administrativo, nombre y rol correctos; sin pantalla Student/Teacher. |
| Cookie de sesión | OK | La sesión de API se emitió como HttpOnly; el valor nunca fue leído ni impreso. |
| Sesión local | OK por contrato | `uboAcademicSession` conserva solamente identidad pública y origen; no se detectaron claves de token o contraseña. |
| Recarga | OK | El dashboard continuó autenticado y restauró el perfil ADMIN. |
| Reinicio Express | OK | Tras reiniciar `src/server.js`, la recarga restauró el dashboard ADMIN sin un segundo login. |
| Logout API | OK | `POST /api/auth/logout` devolvió `204`; el overview sin sesión devolvió `401`. |
| Logout UI | NOT_TESTED | La automatización del navegador no activó botones del dashboard, aunque sí cargó la versión actual y las pruebas cubren el cliente. Requiere una pasada manual breve. |

## Dashboard y overview

El dashboard cargó perfil, resumen, gestión, acciones y bloques LMS. Las métricas DEMO y LMS se presentan con rótulos de origen distintos.

`GET /api/analytics/admin/overview` respondió `200`, `source: LMS`, y devolvió únicamente datos agregados:

- Usuarios: 3; estudiantes: 1; docentes: 1.
- Cursos: 3; matrículas: 3; materiales: 7.
- Evaluaciones publicadas: 0; entregas: 0.
- Sesiones de asistencia: 2; registros: 1.
- Mensajes: 0; notificaciones sin leer: 0; actividad: 0.
- Consultas Tutor: 8; recomendaciones: 3.

No se encontraron contraseñas, hashes, tokens de sesión, QR tokens, mensajes privados ni contenido individual en el overview.

## Aislamiento y spoofing

| Prueba con sesión ADMIN | Resultado |
|---|---|
| Inteligencia Student con `x-user-id`, `x-role`, `userId`, `studentId` falsificados | `403` |
| Progreso Student con parámetros falsificados | `403` |
| Recomendaciones Student con parámetros falsificados | `403` |
| Analítica Teacher con identidad/rol falsificados | `403` |
| Estudiantes de curso Teacher con identidad/rol falsificados | `403` |
| Tutor Student-only con identidad/rol falsificados | `403` |
| Overview Admin con query falsificada | `200`, manteniendo la identidad ADMIN de la cookie |
| Notificaciones ADMIN | `200`, `source: LMS`, sin datos de otros usuarios |
| Overview sin cookie posterior a logout | `401` |

La prueba inicial del Tutor devolvió `400` porque el cuerpo usaba el campo incorrecto (`message`); al enviar el contrato real (`query`) devolvió `403`. No constituye un defecto de autorización.

## Interfaz, responsive y accesibilidad

- Modo claro: OK visualmente; contraste, tarjetas y jerarquía legibles.
- Modo oscuro: NOT_TESTED. El control no pudo activarse mediante la herramienta de navegador; el servicio y sus pruebas unitarias siguen correctos.
- 390 × 844: OK; sin overflow horizontal, tarjetas ni botones cortados.
- 768 × 1024: OK; sin overflow horizontal.
- 1920 × 1080: OK; distribución y tarjetas legibles.
- Accesibilidad: los controles visibles tuvieron nombre accesible; foco visual está definido en CSS. No se realizó un recorrido manual completo por teclado.
- Consola: sin errores nuevos después de cargar el módulo actualizado. Se observó únicamente un `SyntaxError` histórico de la primera carga cacheada, resuelto por el versionado del import.

## Red, PWA y privacidad

- Las APIs privadas usan cookie HttpOnly; no se encontró `Authorization: Bearer` en clientes API.
- No hay endpoints `/api/` en el precache; solo módulos cliente estáticos.
- La caché PWA actual es `ubo-academic-hub-v190` y no incorpora UniEcosystemCore.
- No se expusieron ni almacenaron tokens o contraseñas en los contratos de sesión revisados.

## Regresiones

- Frontend completo: 113/113 pruebas aprobadas.
- Backend completo: 51/51 pruebas aprobadas.
- Core: `npm test` y `npm run check` aprobados desde UniEcosystemCore.
- Sintaxis: `node --check` aprobó los 300 archivos JavaScript del proyecto.
- PWA/ESM: `tests/pwa-esm-precache.test.js` aprobado; cubre los nuevos specifiers con query string.
- Regresión API Student: `GET /api/progress/student` como STUDENT devolvió `200`.
- Regresión API Teacher: `GET /api/analytics/teacher/courses` como TEACHER devolvió `200`.
- Regresión visual Student/Teacher: NOT_TESTED en esta fase, porque el control de logout del navegador automatizado no reaccionó y no se forzó una modificación de sesión.

## Core y limitaciones

UniEcosystemCore no fue modificado. No se modificaron datos académicos, notas, asistencia ni matrícula.

Limitación pendiente: ejecutar manualmente en navegador el toggle de tema y el botón de logout del panel Admin, luego una pasada visual rápida Student/Teacher. La corrección API de logout ya está cubierta por prueba unitaria y por revocación real de sesión HTTP.
