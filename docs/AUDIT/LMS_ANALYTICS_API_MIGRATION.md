# Analítica LMS API

Esta analítica representa información derivada del LMS Academic Hub y no constituye analítica académica oficial de la Universidad.

## Fuente y límites

Usa exclusivamente PostgreSQL del LMS complementario: cursos, membresías, evaluaciones, entregas, QR, mensajes y materiales. Cada respuesta correcta declara `source: "LMS"`. La ausencia de evidencia se expresa con `null` o `INSUFFICIENT_DATA`; nunca se transforma en una métrica oficial ni en un cero artificial. La tendencia queda como `INSUFFICIENT_DATA` hasta disponer de historial suficiente y los temas débiles se devuelven como una lista vacía cuando el LMS aún no tiene evidencia para calcularlos.

No usa `localStorage` en backend, no consulta notas, asistencia ni matrícula institucional oficial y no expone contraseña, tokens ni secretos. El frontend mantiene `services/analytics/academic-analytics-service.js` como fallback DEMO.

## Endpoints y autorización

- `GET /api/analytics/student`: exige un `x-user-id` cuyo rol resuelto en `users_reference` sea `STUDENT`.
- `GET /api/analytics/student/:courseId`: además exige membresía de ese estudiante en el curso LMS. Las métricas se consultan con alcance del curso solicitado.
- `GET /api/analytics/teacher/courses` y `GET /api/analytics/teacher/courses/:courseId`: sólo devuelven cursos cuyo `teacher_reference` coincide con el usuario resuelto.
- `GET /api/analytics/admin/overview`: exige rol `ADMIN` resuelto desde base de datos.

Los parámetros `studentId` y el header `role` no son autoridad: se ignoran para decidir identidad o permisos.

## Validación HTTP real

Con PostgreSQL `ubo-academic-hub-postgres` saludable y las migraciones `001` a `008` y seed `001` aplicadas:

- Sofía recibió `200` y `source: "LMS"` en su resumen y en el curso Bases de Datos.
- Un `courseId` inexistente o no autorizado devolvió `403 COURSE_ACCESS_DENIED`.
- Carlos recibió `200` en sus cursos y en Bases de Datos; la respuesta sólo incluyó sus cursos LMS.
- Administración recibió `200` y `source: "LMS"` en el resumen institucional.
- Sofía y Carlos recibieron `403 ADMIN_ROLE_REQUIRED` al pedir el resumen Admin.
- `studentId` por query no alteró el resultado de Sofía y `role: ADMIN` no elevó su acceso.

No existía un segundo profesor en los datos DEMO, por lo que no se creó uno artificialmente. Se validó el aislamiento docente por resolución de `teacher_reference`, curso inexistente/no autorizado y tests de servicio.

## Persistencia e interfaz

Las consultas se leen desde PostgreSQL. Después de reiniciar únicamente Express, sin detener Docker ni borrar la base, los endpoints Student, Teacher y Admin vuelven a responder contra los mismos datos LMS.

Las tres vistas conservan su render DEMO inicial y después intentan API-first:

- Student, **Mi estado académico**, muestra `Origen: Datos del LMS Academic Hub` cuando la API está disponible; ante falla conserva `Origen: Datos DEMO`.
- Teacher, **Seguimiento académico**, muestra sus cursos y origen LMS; ante falla conserva el seguimiento DEMO existente.
- Admin, **Analítica institucional**, muestra métricas LMS con su origen; ante falla conserva la analítica DEMO.

Ninguna vista presenta estos datos como oficiales UBO.

## Pruebas

`backend/test/analytics.test.js` cubre riesgo explicable, datos insuficientes, resolución de rol desde base de datos, rechazo de escalamiento y salida docente sin métricas inventadas. `tests/analytics-api.test.js` cubre header `x-user-id`, `source: LMS`, `courseId`, ausencia de contraseña y los fallbacks por sesión ausente, red y respuesta no exitosa.
