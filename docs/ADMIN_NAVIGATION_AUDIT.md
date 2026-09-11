# Auditoría de navegación interna — Panel Administrativo

> **RESULT: ADMIN_NAVIGATION_ISSUES_FOUND**
> **AUDIT_DATE: 2026-09-09**
> **PWA: ubo-academic-hub-v114**

## A. Estado general

El Panel Administrativo tiene una única vista real y no posee pantallas secundarias. Sus datos de resumen, gestión y estadísticas se renderizan dentro de `admin-dashboard.html`. No hay enlaces rotos ni retorno desde una segunda vista que corregir.

Se encontró una mejora de UX pendiente: el único control visible de salida es **Cerrar sesión demo**. No existe un acceso explícito al Selector Demo que permita volver sin cerrar la identidad, a diferencia del patrón incorporado al Panel Profesor en la Fase 1.64.

## B. Estructura Admin encontrada

| Archivo | Rol |
| --- | --- |
| `modules/admin/admin-dashboard.html` | Única vista HTML del Admin. |
| `modules/admin/admin-dashboard.js` | Entry ESM: guard, render y logout. |
| `modules/admin/admin-dashboard.css` | Estilos aislados y responsive del dashboard. |

No existen otros HTML, routers propios ni vistas secundarias bajo `modules/admin/`.

## C. Entry points

- Entrada desde Selector: `modules/demo/demo-router.js` resuelve `ADMIN` a `../admin/admin-dashboard.html`.
- Entry del dashboard: `<script type="module" src="./admin-dashboard.js">`.
- Servicios: `admin-service.js` y `administrative-action-service.js`.
- Guard: `enforceDemoRouteGuard("ADMIN", …)` desde `core/demo-route-guard.js`.

## D. Vistas existentes

| Vista | Ruta | Estado |
| --- | --- | --- |
| Selector Demo | `/modules/demo/demo-selector.html` | Externa al módulo; selecciona perfil. |
| Dashboard Admin | `/modules/admin/admin-dashboard.html` | Única vista administrativa. |

No existen vistas de usuarios, profesores, estudiantes, carreras, cursos, salas, horarios, permisos, estadísticas o configuración. Las tarjetas mostradas son resúmenes informativos dentro del dashboard; no son enlaces ni botones de navegación.

## E. Funcionalidades

- Perfil de Administrador UBO.
- Resumen institucional.
- Gestión académica en tarjetas de solo lectura/preparación.
- Estadísticas y operación institucional.
- Logout demo.

Todas salvo logout permanecen dentro de la misma vista y no cambian ruta.

## F. Matriz de navegación

| Origen | Acción | Destino | Tiene retorno | Retorno esperado |
| --- | --- | --- | --- | --- |
| Selector Demo | Seleccionar Administrador UBO | `/modules/admin/admin-dashboard.html` | Sí, por logout | Selector Demo. |
| Dashboard Admin | Consultar métricas, gestión o estadísticas | Mismo dashboard | No aplica | No cambia de vista. |
| Dashboard Admin | Cerrar sesión demo | `/modules/demo/demo-selector.html` | Sí | Selector Demo, identidad demo limpia. |
| Dashboard Admin | Acceso directo sin identidad | Guard → Selector Demo | Sí | Selector Demo. |
| Dashboard Admin con Student | Guard → `../../index.html` | Sí | Aplicación Student. |
| Dashboard Admin con Teacher | Guard → `../professor/teacher-dashboard.html` | Sí | Panel Profesor. |

## G. Navegación de retorno

No hay pantallas secundarias y, por tanto, no hay retorno faltante desde una vista hija. El dashboard no depende de `history.back()`.

La única carencia observada es semántica: **Cerrar sesión demo** sí devuelve al Selector, pero no equivale a un control de navegación. Falta un enlace visible **Selector Demo** para regresar al nivel de selección preservando la identidad activa, si ese comportamiento se decide necesario en una fase posterior.

## H. Logout

`setupDemoLogout()` invoca `clearCurrentDemoIdentity()` y luego `window.location.replace("../demo/demo-selector.html")`.

La semántica coincide con el flujo esperado Admin → Cerrar sesión demo → Selector Demo. Las pruebas de logout y coordinación de sesión pasan. No se modificó esta lógica.

## I. Guards

El guard ADMIN es obligatorio antes de `renderAdminDashboard()`:

- Student es dirigido al inicio Student.
- Teacher es dirigido al Panel Profesor.
- Sin identidad o identidad inválida es dirigido al Selector Demo.
- Solo `ADMIN` permite el render del dashboard.

La comprobación visual disponible confirmó que una sesión Student al abrir la ruta Admin termina en la aplicación Student. Los tests de guards cubren los demás casos, incluyendo Teacher/Admin y acceso directo sin identidad.

## J. Prueba responsive

La única vista usa grids responsive: métricas de 2/3/5 columnas, gestión de 1/2 columnas y estadísticas de 1/2 columnas según ancho. No hay navegación inferior en el shell Admin ni componentes de navegación secundarios que revisar.

## K. PWA

- `admin-dashboard.html`, `admin-dashboard.css` y `admin-dashboard.js` están declarados en el precache actual.
- La prueba `pwa-esm-precache.test.js` cubre el grafo Admin y pasa.
- No se agregaron módulos ni se modificó `service-worker.js`; la versión queda en `ubo-academic-hub-v114`.

## L. Resultados de tests

La suite UBO, pruebas de identidad, sesión, logout, guards, adapter, shadow, coexistencia, preparación canario, PWA/precache y `node --check` pasan. Core también pasa `npm test` y `npm run check` sin cambios.

## M. Problemas encontrados

### UX — no crítico

1. El Admin no tiene un enlace visible al Selector Demo; la única vuelta disponible cierra la sesión demo.

## N. Problemas inexistentes

- No hay rutas Admin secundarias sin retorno.
- No hay uso de `history.back()`.
- No hay router Admin paralelo.
- No hay botones de gestión que naveguen a rutas inexistentes.
- No hay regresión detectada en Student o Profesor derivada de esta auditoría.
- Core, flags, datos y PWA permanecen intactos.

## O. Correcciones recomendadas

En una fase separada, evaluar agregar un enlace visible **Selector Demo** en el header Admin, separado de **Cerrar sesión demo**, usando la ruta existente `../demo/demo-selector.html`. No es necesaria ninguna nueva vista, router, guard ni dependencia.

## P. Riesgos

Cambiar el dashboard sin mantener la distinción entre navegación y logout podría conservar identidad donde se esperaba limpieza o limpiar identidad accidentalmente. Cualquier corrección debe ser solo un enlace HTML/CSS y no alterar `clearCurrentDemoIdentity()` ni el guard.

## Q. Recomendación de siguiente fase

Si se aprueba la mejora UX, replicar de forma mínima el patrón del Panel Profesor: acceso explícito al Selector Demo y logout separado. No modificar el resto de las tarjetas mientras no existan vistas administrativas reales.
