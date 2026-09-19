# Cierre visual multirrol — Fase 2.46.1

Fecha: 2026-09-18

## Alcance

Validación visual y de sesión de los flujos institucionales ya existentes para ADMIN, STUDENT y TEACHER. No se activaron flags de Core, no se añadieron funciones académicas ni se modificaron datos LMS.

## Resultado por rol

| Rol | Ruta validada | Resultado |
| --- | --- | --- |
| ADMIN | Acceso institucional → Panel Administrativo | OK: perfil, resumen, gestión, analítica y acciones visibles. |
| ADMIN | Botón `Cerrar sesión` | OK: redirige al selector y una consulta posterior al overview devuelve `AUTHENTICATION_REQUIRED`. |
| ADMIN | Modo oscuro | OK: la interacción real actualiza `data-theme="dark"`; no se observó overflow horizontal en escritorio. |
| STUDENT | Inicio → Mis ramos → Bases de Datos | OK: el detalle conserva información académica y el bloque LMS (materiales, progreso, asistencia, recomendaciones y tutor). |
| STUDENT | Tema oscuro | OK: el detalle se muestra con `data-theme="dark"`, legible y sin overflow horizontal en escritorio. |
| STUDENT | Cerrar sesión | OK: vuelve al acceso y `/api/users/me` queda no autenticado. |
| TEACHER | Dashboard → Mis cursos → detalle de Bases de Datos | OK: dashboard, curso, alumnos, material, asistencia y analítica LMS visibles. |
| TEACHER | Tema oscuro | OK en dashboard y detalle después de corregir la aplicación de preferencia en el detalle. |
| TEACHER | Cerrar sesión | OK: vuelve al selector institucional mediante el control visible. |

## Correcciones mínimas realizadas

1. Los cierres de sesión de STUDENT y TEACHER ahora solicitan primero la revocación de la sesión backend mediante el helper existente `logout()`; después limpian únicamente sus estados de interfaz ya existentes. Esto evita conservar una cookie HttpOnly válida al cambiar de perfil.
2. El detalle docente aplica la preferencia visual existente al cargar y define tokens/estados oscuros locales para tarjetas, métricas, campos y resumen. No se modificó el contenido ni la lógica de curso.
3. Se actualizaron las referencias versionadas de los módulos afectados y el precache PWA a `ubo-academic-hub-v192` para evitar servir assets previos.

## Responsive y accesibilidad

- Escritorio: comprobado sin overflow horizontal en los tres flujos revisados (`scrollWidth === clientWidth`).
- Controles visibles de sesión y tema: accesibles por nombre/etiqueta en ADMIN, STUDENT y TEACHER.
- 390 px y 768 px: **NOT_TESTED** en esta corrida; el navegador aislado de validación no conservó una interfaz de cambio de viewport después del cierre docente. No se infiere su resultado.

## Consola y límites

- No se observó un error JavaScript nuevo durante las cargas y navegaciones validadas.
- La comprobación no ejecutó acciones docentes ni modificaciones académicas; los controles deshabilitados por ausencia de datos LMS no se consideran una regresión visual.
- Se mantienen las limitaciones de datos demo y de backend local ya documentadas.

## Garantías de la fase

- `USE_CORE_SESSION=false`, `USE_CORE_IDENTITY_CANARY=false`, `USE_CANONICAL_CAREER=false` y `USE_CANONICAL_ROOM=false` permanecen sin cambios.
- UniEcosystemCore no fue modificado.
- No hubo commit, push ni deploy.

## Validación técnica

- `node --check` de los módulos modificados: correcto.
- Suite frontend: 113 pruebas aprobadas, 0 fallos.
- Suite backend: 51 pruebas aprobadas, 0 fallos.
- Grafo ESM/precache PWA: correcto.
- `npm test` y `npm run check` de UniEcosystemCore: correctos.
- `git diff --check`: correcto; Git informa únicamente avisos existentes de normalización LF/CRLF.
- El proyecto frontend no dispone de `package.json` en su raíz, por lo que `npm run check` allí no aplica; las comprobaciones disponibles se ejecutaron en backend y Core.
