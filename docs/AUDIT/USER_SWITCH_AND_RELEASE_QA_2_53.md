# QA 2.53 — Cambio de usuario y preparación de cierre

## Alcance

Corrección mínima del flujo `Cambiar usuario` en los dashboards Teacher y Admin. No se modificaron Core, PostgreSQL, datos académicos, lógica LMS ni el contrato de autenticación.

## Diagnóstico

Los controles `Cambiar usuario` eran enlaces directos al Selector Demo. Esa navegación no ejecutaba `logoutFromApi()`, `clearCurrentDemoIdentity()` ni `clearInstitutionalSession()`. Como consecuencia, el Selector Demo detectaba la cookie/sesión backend todavía activa, deshabilitaba sus campos y mostraba que debía cerrarse sesión para cambiar de perfil.

El comportamiento se reprodujo con una sesión backend activa de Carlos Pérez: el selector aparecía con campos y botón `Ingresar` deshabilitados.

## Corrección aplicada

- `modules/professor/teacher-dashboard.html`: el enlace se convirtió en botón `#teacher-change-user`.
- `modules/professor/teacher-dashboard.js`: `Cerrar sesión` y `Cambiar usuario` comparten `endTeacherDemoSession()`.
- `modules/admin/admin-dashboard.html`: el enlace se convirtió en botón `#admin-change-user`.
- `modules/admin/admin-dashboard.js`: `Cerrar sesión` y `Cambiar usuario` comparten `endAdminDemoSession()`.
- Ambos caminos revocan primero la sesión API, limpian identidad demo y sesión institucional, y recién después reemplazan la ubicación por el Selector Demo.
- Se incrementaron los recursos de dashboard a `?v=4` y el precache a `ubo-academic-hub-v196`, porque el navegador servía la versión anterior del JavaScript desde PWA.

La acción "Cambiar usuario" conserva su diferencia de UX respecto de "Cerrar sesión", pero ambas eliminan la autoridad previa; esto evita reutilizar una sesión de un rol al intentar acceder como otro.

## Verificación realizada

| Escenario | Resultado | Evidencia |
| --- | --- | --- |
| Teacher (Carlos) → Cambiar usuario | OK | El botón llevó al Selector Demo con `Ingresar` habilitado y mensaje informativo estándar. |
| Admin → Cambiar usuario | OK | El botón llevó al Selector Demo con `Ingresar` habilitado y mensaje informativo estándar. |
| Limpieza de identidad de Student, Teacher y Admin | OK | `tests/demo-logout-session-coordination.test.js` valida revocación, reemplazo de perfil y denegación de rutas tras logout. |
| Contrato de sesión y controles de cambio | OK | `tests/institutional-session.test.js` valida sesión sin contraseña y presencia/conexión de los nuevos controles. |
| Login UI | OK | El selector conserva `Usuario institucional`, `Contraseña` y el botón `Ingresar`. |
| Autoridad previa reutilizada | OK | La sesión local se limpia antes de la navegación y la API recibe el logout antes de redirigir. |

Los intentos de automatizar nuevamente el formulario Student dentro de la misma pestaña controlada no preservaron valores de los campos en el controlador del navegador, por lo que esa interacción visual específica queda `NOT_TESTED` en esta corrida. No se infiere como aprobada. La cobertura de transición de identidad está respaldada por pruebas unitarias para los tres roles.

## Responsive, tema y consola

| Área | Estado |
| --- | --- |
| Teacher/Admin: control de cambio de usuario | OK en navegador de escritorio durante esta corrida. |
| 390×844 | NOT_TESTED en esta corrida. |
| 768×1024 | NOT_TESTED en esta corrida. |
| 1920×1080 | NOT_TESTED en esta corrida. |
| Light/Dark | Sin cambios funcionales; la corrección conserva las clases y estilos existentes. |
| Consola Teacher/Admin | Sin errores ni advertencias nuevas observadas durante el flujo de cambio de usuario. |

La nueva diapositiva móvil incluye un marcador explícito para una captura real. No se insertó ninguna imagen, porque no hubo una captura verificable disponible en el espacio de trabajo.

## Validaciones técnicas

- `node --check` sobre 300 archivos JavaScript del proyecto — OK.
- `node --test tests/*.test.js` — 113/113 OK.
- `backend/npm test` — 51/51 OK.
- UniEcosystemCore: `npm test` y `npm run check` — OK, sin modificaciones.
- Pruebas PWA/ESM existentes — OK, incluido el precache `ubo-academic-hub-v196`.
- `GET /api/health` — `status: ok`.
- `git diff --check` — OK.

## Riesgo y recomendación

El flujo Teacher/Admin queda corregido y protegido contra la sesión backend residual. Antes de declarar un cierre visual completo, se debe repetir una QA manual de Student, Teacher y Admin en `390×844`, `768×1024` y `1920×1080`, incluyendo Light/Dark, y aportar una captura real de Dark Mode móvil para insertar en la presentación.

## Límites de esta fase

- No se realizaron commits, push ni deploy.
- No se modificó UniEcosystemCore.
- No se modificaron datos académicos, autenticación de backend, permisos ni PostgreSQL.
