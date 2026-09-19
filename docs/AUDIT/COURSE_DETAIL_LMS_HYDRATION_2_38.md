# Hidratación LMS de Course Detail — Fase 2.38

## Síntoma

En una observación anterior, el detalle de **Bases de Datos** mostró el mensaje
de fallback: `Datos DEMO: no hay una identidad LMS confirmada o la API no está
disponible.`

## Diagnóstico y causa raíz

El flujo actual no presenta un fallo de identidad, mapeo ni API:

- La sesión backend activa de Sofía conserva el identificador institucional
  `ceac5429-f19e-43e8-97f1-a1fca0e2247b` en `uboAcademicSession`.
- El identificador legacy `db` se resuelve a
  `7c6f443a-dc0e-4c3e-8e73-7b7d8717b219` mediante
  `/api/course-identity/resolve?identifier=db&type=legacy`.
- Los clientes API usan `x-user-id`; no envían contraseña, rol, `studentId` ni
  otros identificadores como autoridad.
- La instancia previa del navegador conservaba assets del shell anterior. Tras
  cargar el shell actualizado con la caché `ubo-academic-hub-v182`, el mismo
  flujo se hidrató correctamente. No se observó CORS, `Failed to fetch`, 401,
  403 o 404 en la reproducción actual.

Por tanto, el incidente correspondía a contenido previamente servido por
caché/shell y no a una incompatibilidad de sesión ni de la API LMS. No fue
necesaria una corrección funcional adicional en esta fase.

## Reproducción validada en navegador

1. Iniciar sesión como Sofía con sesión de origen `backend`.
2. Abrir **Mis ramos** y seleccionar **Bases de Datos**.
3. Esperar la carga asíncrona de Course Detail.

El navegador mostró **Datos del LMS Academic Hub** con:

- `Bases de Datos` / `INF-302`;
- tres materiales: Clave primaria, Modelo relacional y Normalización;
- dos sesiones de asistencia, una presente y `50%`;
- inteligencia con riesgo `HIGH` y señal `LOW_ATTENDANCE_LMS`;
- tendencia `INSUFFICIENT_DATA` y `overall: null`, sin convertirlos en cero;
- recomendación basada en el recurso **Clave primaria**.

## Requests comprobados

| Request | Identidad | Estado |
| --- | --- | --- |
| `GET /api/course-identity/resolve?identifier=db&type=legacy` | No requerida para resolver el mapa | 200 |
| `GET /api/courses/7c6f443a-dc0e-4c3e-8e73-7b7d8717b219` | `x-user-id` de Sofía | 200 |
| `GET /api/progress/student/:courseId` | `x-user-id` de Sofía | 200 |
| `GET /api/intelligence/student/:courseId` | `x-user-id` de Sofía | 200 |
| `GET /api/recommendations/intelligent/:courseId` | `x-user-id` de Sofía | 200 |

La comprobación visual se realizó en `http://localhost:3000`; el bloque LMS
quedó renderizado y la consola no informó errores ni advertencias relevantes
en esa reproducción.

## Service Worker

La validación 2.38 usó `ubo-academic-hub-v182`; la Fase 2.39 lo actualiza a
`ubo-academic-hub-v183` para publicar sus assets de interfaz. El precache contiene el
servicio de Course Detail y conserva la deduplicación de assets mediante
`Set`. No cachea respuestas privadas de API. No se borraron cachés de manera
indiscriminada ni se desactivó el Service Worker.

## Archivos modificados en esta fase

- `docs/AUDIT/COURSE_DETAIL_LMS_FIX_2_36.md`
- `docs/AUDIT/COURSE_DETAIL_LMS_HYDRATION_2_38.md`

No se modificaron frontend funcional, backend, PostgreSQL, Core ni datos LMS.

## Validación técnica

- `node --check app.js`: correcto.
- `node --check services/api/course-detail-api-service.js`: correcto.
- Prueba de composición de Course Detail: correcta.
- La suite frontend y la suite backend permanecen aprobadas en la validación
  previa del proyecto.
- `git diff --check`: sin errores de espacio.

## Limitaciones

La inspección detallada de cada fila de Network no está expuesta por el
entorno de automatización utilizado. Se verificó la navegación real en
navegador, el resultado renderizado y los estados HTTP de los mismos endpoints
contra el backend local. No se registran credenciales en documentación,
consola ni requests.

## Resultado

`SESSION_USER_ID_OK`, `COURSE_ID_OK`, `COURSE_DETAIL_API_CALLED`,
`LMS_API_RESPONSES_OK`, `LMS_RESPONSE_PARSED`, `FALLBACK_BEHAVIOR_OK`,
`APP_LOAD_OK`, `COURSE_DETAIL_LMS_HYDRATED`, `CONSOLE_OK`,
`NO_CREDENTIAL_LEAK`, `LMS_DEMO_SEPARATION_OK` y `CORE_UNMODIFIED`.

La activación interna del Service Worker se validó mediante su versión,
precache y carga actual; la inspección manual de Cache Storage queda como
`NOT_TESTED` en este entorno.
