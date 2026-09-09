# Auditoría de perfiles demo y autorización actual

Fecha de auditoría: Fase 1.46. Este documento describe el comportamiento encontrado; no introduce autorización nueva ni conecta UBO con UniEcosystemCore.

## Usuarios demo encontrados

| Perfil | Fuente | ID | Rol | Permisos actuales |
|---|---|---|---|---|
| Sofía Martínez Rojas | `data/users.js` y fixture legacy de `app.js` | `student-sofia-martinez` | `STUDENT` | `student.dashboard.read`, `student.courses.read`, `student.grades.read`, `student.attendance.read`, `student.simulators.use` |
| Carlos Pérez | `data/users.js` | `teacher-carlos-perez` | `TEACHER` | `teacher.dashboard.read`, `teacher.courses.read`, `teacher.students.read`, `teacher.attendance.manage`, `teacher.grades.manage`, `teacher.materials.manage`, `teacher.communication.manage` |
| Administrador UBO | `data/users.js` | `admin-ubo` | `ADMIN` | `admin.dashboard.read`, gestión de usuarios, profesores, carreras, cursos, salas, horarios, permisos y analítica |

La cuenta legacy de Sofía está definida de manera independiente en `app.js`: `sofia.martinez` con la credencial demo ya existente `demo123`. No existe login legacy equivalente para Carlos ni Administrador, y esta fase no crea credenciales nuevas.

## Login y sesión actuales

### Aplicación estudiante

`app.js` conserva un arreglo local `users`, valida usuario y contraseña en `login()`, y crea `uboSession` en `localStorage` con `loggedIn`, `username` y `studentData`. La sesión se consulta mediante `session()` y se elimina en `logout()`. Los datos persistentes de funciones estudiantiles se separan por `username` mediante claves de almacenamiento derivadas.

La protección existente de pantallas del estudiante es una redirección de navegación para enlaces internos cuando no hay `uboSession`. El objeto de sesión legacy no contiene `role` ni `permissions`.

### Entorno demo de roles

`modules/demo/demo-selector.js` obtiene los tres usuarios desde `data/users.js`, los selecciona con `selectDemoUser()` y los deja en `core/session.js`. Esa sesión es solo memoria de la página actual y no reemplaza `uboSession`.

`modules/demo/demo-router.js` asocia roles con rutas demo. Después de navegar, las páginas Profesor y Admin se inicializan desde sus servicios y datos demo propios; no leen `core/session.js` ni exigen una sesión activa.

## Roles y política legacy

`core/permissions.js` declara los roles `STUDENT`, `TEACHER` y `ADMIN`; ofrece `getRolePermissions`, `hasRole` y `hasPermission`. `core/router.js` conoce una ruta esperada por rol y puede decidir `canNavigate(route, user)`.

La política sí se consume en `services/admin-actions/administrative-action-service.js`: las acciones administrativas requieren rol `ADMIN` y el permiso específico. Los servicios de acciones de Biblioteca, Eventos, Casino, Pagos y Emergencias validan roles propios al preparar sus acciones. Esas validaciones son locales a sus servicios y no equivalen a un guard de navegación global.

## Matriz de acceso observada

| Funcionalidad | Estudiante | Profesor | Admin | Tipo real de control |
|---|---|---|---|---|
| Dashboard estudiante | Disponible mediante login legacy | No existe experiencia equivalente | No existe experiencia equivalente | Sesión legacy para navegación interna; no RBAC |
| Dashboard profesor | URL demo accesible | Disponible y muestra Carlos | URL demo accesible | `UI_ONLY`; sin guard runtime |
| Dashboard administrativo | URL demo accesible | URL demo accesible | Disponible y muestra Administrador UBO | `UI_ONLY`; sin guard runtime |
| Perfil y datos académicos estudiante | Disponible tras login legacy | No aplica | No aplica | Sesión legacy por usuario |
| Cursos profesor | URL demo accesible | Disponible para Carlos | URL demo accesible | Datos del dashboard fijan el profesor; no RBAC |
| Gestión administrativa | No puede preparar una acción a través del servicio | No puede preparar una acción a través del servicio | Puede preparar acciones `available` | Validación local del servicio administrativo |
| Estadísticas administrativas | URL demo accesible | URL demo accesible | Visible | `UI_ONLY`; sin guard runtime |
| Router futuro `canNavigate` | Permite solo ruta STUDENT | Permite solo ruta TEACHER | Permite solo ruta ADMIN | Política funcional, no integrada a UI |

## UI frente a autorización

- **UI visibility:** botones deshabilitados, selector demo y páginas separadas ayudan a presentar experiencias distintas.
- **Authorization enforcement:** solo los servicios de acciones que invocan validadores aplican comprobaciones de rol/permisos. No hay middleware, guard de ruta ni control de sesión conectado a las páginas Profesor/Admin.

Ocultar o no enlazar un botón no es autorización. Una URL directa a los shells Profesor/Admin no consulta el rol seleccionado.

## Gaps encontrados

1. `AUTHORIZATION_GAP LEGACY_STUDENT_LOGIN_UNMAPPED_TO_DEMO_USERS`: la identidad de Sofía se representa por separado entre `app.js` y `data/users.js`.
2. `AUTHORIZATION_GAP PROFESSOR_ADMIN_SHELLS_HAVE_NO_RUNTIME_ROLE_GUARD`: ambos shells son accesibles por URL directa y no consumen `core/session.js`, `core/router.js` ni `core/permissions.js`.
3. `UI_ONLY DEMO_SELECTOR_SELECTS_A_ROUTE_BUT_DOES_NOT_GUARD_DIRECT_URLS`: la selección solo resuelve una ruta y una sesión en memoria antes de navegar.
4. `NOT_CURRENTLY_ENFORCED CORE_ROUTER_IS_NOT_CONNECTED_TO_LEGACY_OR_DEMO_NAVIGATION`: `canNavigate()` funciona como contrato futuro, pero ninguna pantalla lo invoca actualmente.
5. `REQUIRES_AUTHORIZATION_LAYER DIRECT_SHELL_ACCESS_REQUIRES_FUTURE_INTEGRATION`: se necesitará una frontera de identidad/sesión que adapte el login legacy y aplique guards antes de integrar Core.

Estos hallazgos son intencionalmente documentados, no corregidos, para no inventar aislamiento ni reemplazar la autorización legacy en esta fase.

## Pruebas realizadas

La prueba `tests/demo-profiles-authorization-audit.test.js` comprueba:

- Identidad, rol y permisos de los tres usuarios demo.
- Acceso esperado del contrato `core/router.js` y rechazos de rol/permiso cruzado.
- Rechazo de estudiante, profesor, usuario desconocido y permisos inexistentes en una acción administrativa.
- Selección demo y limpieza de la sesión futura en memoria.
- Evidencia estática de que el login legacy no está conectado a `data/users.js` y de que los shells Profesor/Admin no aplican guard runtime.

La prueba informa los gaps anteriores y termina correctamente porque son condiciones auditadas, no errores de sintaxis ni regresiones ocultas.

## Relación con UniEcosystemCore

La frontera actual se conserva como UBO → adapters institucionales → Core, limitada a los adapters read-only de Career y Room. No se modificó Core ni se creó un adapter de autorización. Las verificaciones de aislamiento deben seguir mostrando `CORE_PRODUCT_ISOLATION_OK` y `CORE_RUNTIME_ISOLATION_OK`.

## Career, Room y PWA

- `USE_CANONICAL_CAREER=false`; no se activa ni se modifica la migración de Career.
- `USE_CANONICAL_ROOM=false`; no se activa ni se modifica la migración de Room.
- El service worker permanece en `ubo-academic-hub-v113`. La validación de precache creada en Fase 1.45 debe continuar pasando.

## Riesgos y recomendación siguiente

El riesgo principal no es un permiso incorrecto dentro de la política: es que la política todavía no controla las rutas reales. La siguiente fase recomendada es diseñar, sin integrar todavía, una frontera única de resolución de identidad UBO que pueda adaptar `uboSession` y el selector demo a un contrato de sesión explícito. Solo después deberían definirse guards de ruta reversibles para Profesor/Admin y, finalmente, una migración gradual de la autorización legacy.
