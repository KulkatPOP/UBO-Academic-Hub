# Fase 2.45 — QA visual Teacher y cierre de regresión

Fecha de ejecución: 2026-09-15
Entorno: frontend `http://localhost:3000`, API `http://localhost:3001`, PostgreSQL local.

## Resultado

**ADVERTENCIAS — no se declara el cierre completo de la QA.** La autenticación, el dashboard, la restauración mediante recarga, los temas y el cierre de sesión se verificaron visualmente. El detalle LMS no pudo confirmarse porque la navegación observada en la superficie de navegador eliminó el parámetro `courseId` y mostró el detalle DEMO de reserva.

## Precondiciones

- `GET /api/health`: OK (`status: ok`).
- `GET /api/database/health`: OK (`database: connected`).
- La API local y PostgreSQL estaban disponibles durante la prueba.

## Pruebas visuales realizadas

| Área | Estado | Evidencia |
|---|---|---|
| Login docente | OK | El acceso institucional aceptó el perfil docente autorizado y mostró `Panel Profesor`, sin pantalla Student ni pantalla blanca. |
| Dashboard | OK | Se mostró Carlos Pérez, rol Profesor, perfil público, resumen LMS y tres cursos: Bases de Datos, Programación y Álgebra. |
| Sesión y recarga | OK | Al recargar el detalle y el dashboard, la identidad docente siguió activa y no se pidió un nuevo login. |
| Cursos LMS | OK | Las tarjetas LMS muestran código, descripción, estudiantes, materiales, evaluaciones, asistencia, mensajes y estado de analítica sin convertir ausencia de evidencia en métricas inventadas. |
| Tema claro | OK | Se comprobó el cambio desde oscuro a claro en dashboard: contraste, tarjetas y controles permanecieron visibles. |
| Tema oscuro | OK | Se comprobó dashboard oscuro: texto, bordes, tarjetas y controles legibles. |
| Logout | OK | El botón `Cerrar sesión` devolvió al acceso institucional con los campos habilitados. |
| Detalle LMS | ADVERTENCIA | El enlace de Bases de Datos expone `teacher-course-detail.html?courseId=<UUID>` en el dashboard, pero la pestaña automatizada llegó a `teacher-course-detail` sin query y renderizó el curso DEMO de reserva (`INF-302`, 3 inscritos, 2 evaluaciones institucionales). Por ello no valida el contrato LMS del detalle. |
| Estudiantes, materiales, evaluaciones, asistencia y analítica LMS del detalle | NOT_TESTED | Dependen de la navegación LMS del detalle anterior; no se declararon correctos a partir del fallback DEMO. |
| Reinicio de Express | NOT_TESTED | El entorno de ejecución rechazó el comando de parada/reinicio del proceso. La API permaneció saludable; no se simuló ni se afirmó una prueba de reinicio. |
| Mobile 390x844 / tablet 768x1024 / desktop 1920x1080 | NOT_TESTED | La superficie disponible no permitió fijar ni verificar esos viewports exactos. No se extrapoló el resultado de una captura a las tres resoluciones solicitadas. |
| Accesibilidad completa | NOT_TESTED | Se inspeccionaron nombres accesibles, etiquetas y controles en el árbol de accesibilidad, pero no se realizó recorrido de teclado/foco ni medición de contraste. |
| Consola del navegador | NOT_TESTED | Esta superficie no expuso DevTools/consola. |
| localStorage | NOT_TESTED | No se inspeccionó el almacenamiento del navegador. No se intentó leer cookies HttpOnly. |
| Network visual | PARCIAL | Las pruebas HTTP de Fase 2.44 validaron autorización por cookie y rechazo de encabezados falsificados. Esta fase no tuvo panel Network del navegador. |
| Regresión Student visual | NOT_TESTED | No se inició sesión con otro perfil durante esta QA; no se usaron credenciales adicionales. La suite frontend completa conserva las pruebas Student. |

## Hallazgo que requiere seguimiento

**Detalle Teacher LMS no verificado.**

El dashboard hidratado publicó enlaces con UUID LMS, por ejemplo:

`./teacher-course-detail.html?courseId=7c6f443a-dc0e-4c3e-8e73-7b7d8717b219`

Sin embargo, tras activarlo en la superficie automatizada, la URL visible perdió el query y `selectedCourseId()` usó el fallback de `getCourses()[0]`. El resultado fue el detalle DEMO existente. No se aplicó una corrección: todavía debe reproducirse en un navegador estándar con DevTools/Network para distinguir una limitación de la automatización, la ruta del servidor o un defecto real de navegación/hidratación.

También se observó una inconsistencia cosmética ya existente en el dashboard LMS: `3 materials` y `0 evaluacións`. No se modificó porque la fase es QA y la prioridad es resolver primero el detalle LMS.

## Seguridad y aislamiento

- El dashboard expuso únicamente identidad pública docente; no se observaron contraseñas, tokens ni sesiones en las tarjetas.
- No se intentó leer cookies HttpOnly ni se imprimieron secretos.
- El Service Worker mantiene rutas documentales de shell; `/api/*` no forma parte de su lista de precache.
- No se modificaron datos académicos, asistencia, evaluaciones, matrícula ni Core.

## Validaciones técnicas

| Validación | Resultado |
|---|---|
| `node --check` de JavaScript UBO | OK — 299 archivos |
| Frontend `node --test tests/*.test.js` | OK — 111/111 |
| Backend `npm test` | OK — 51/51 |
| UniEcosystemCore `npm test` | OK |
| UniEcosystemCore `npm run check` | OK |
| `git diff --check` | OK — sin errores de whitespace; sólo avisos CRLF preexistentes de Git |

Nota: `npm test` en la raíz de UBO no aplica porque no existe `package.json` allí; las suites se ejecutaron en sus directorios reales.

## Estados de criterio

`TEACHER_LOGIN_UI_OK`
`TEACHER_SESSION_UI_OK`
`TEACHER_RESTORE_UI_OK`
`TEACHER_DASHBOARD_UI_OK`
`TEACHER_COURSES_UI_OK`
`TEACHER_LOGOUT_UI_OK`
`LIGHT_MODE_OK`
`DARK_MODE_OK`
`NETWORK_OK` (por evidencia HTTP previa de Fase 2.44)
`PWA_PRIVATE_DATA_SAFE` (por inspección estática del Service Worker)
`CORE_UNMODIFIED`

`TEACHER_RESTART_UI_NOT_TESTED`
`TEACHER_COURSE_DETAIL_UI_NOT_TESTED`
`TEACHER_STUDENTS_UI_NOT_TESTED`
`TEACHER_MATERIALS_UI_NOT_TESTED`
`TEACHER_EVALUATIONS_UI_NOT_TESTED`
`TEACHER_ATTENDANCE_UI_NOT_TESTED`
`TEACHER_ANALYTICS_UI_NOT_TESTED`
`MOBILE_RESPONSIVE_NOT_TESTED`
`TABLET_RESPONSIVE_NOT_TESTED`
`DESKTOP_RESPONSIVE_NOT_TESTED`
`ACCESSIBILITY_NOT_TESTED`
`CONSOLE_NOT_TESTED`
`NO_LOCAL_TOKEN_NOT_TESTED`
`STUDENT_REGRESSION_NOT_TESTED`

## Próximo paso recomendado

Reproducir el enlace exacto del detalle LMS en un navegador estándar, con Network y URL visible, antes de modificar código. Si el parámetro se pierde fuera de la automatización, aplicar una corrección mínima de navegación y repetir la QA del detalle, reinicio de Express y regresión visual Student.
