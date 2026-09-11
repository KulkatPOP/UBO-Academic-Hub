# Preparación de corrida manual — Core Session Canary / Teacher

> **CANARY_RUN_ID: CANARY-TEACHER-001**
> **RUN_STATUS: NOT_STARTED**
> **PREPARATION_STATUS: READY**
> **CANARY_AUTHORIZATION: NOT_GRANTED**
> **CANARY_EXECUTION: NOT_STARTED**

Este documento prepara una futura corrida manual. No activa `USE_CORE_SESSION`, no registra una ejecución real y no concede autorización.

## Perfil y alcance

| Elemento | Estado |
|---|---|
| Perfil | Carlos Pérez |
| ID | `teacher-carlos-perez` |
| Rol | `TEACHER` |
| Teacher | `CANARY_SCOPE` |
| Student | `OUTSIDE_SCOPE` |
| Admin | `OUTSIDE_SCOPE` |
| Career | `OUTSIDE_SCOPE` |
| Room | `OUTSIDE_SCOPE` |
| Authorization | `OUTSIDE_SCOPE` |

## Responsables

| Rol operativo | Estado |
|---|---|
| Technical Approver | `[POR DEFINIR]` |
| Project Approver | `[POR DEFINIR]` |
| Test Approver | `[POR DEFINIR]` |
| Operator | `[POR DEFINIR]` |

Estos campos no representan una aprobación actual.

## Precheck real de preparación

| Requisito | Resultado | Estado |
|---|---|---|
| Checkpoint UBO `ca238a93c2cc15bbf597e643cab26bd02aa42128` | Confirmado por verificación Git | `READY` |
| Checkpoint Core `414eee6392afa54e93adcc4f6c42d3be08d4387a` | Confirmado por verificación Git | `READY` |
| PWA `ubo-academic-hub-v114` | Confirmada estáticamente | `READY` |
| Suite UBO, identity, shadow, session, coexistence, logout y guards | Correctas | `READY` |
| Canary design, operations, run record y approval checklist | Correctos | `READY` |
| PWA/precache y `node --check` | Correctos | `READY` |
| Core `npm test` y `npm run check` | Correctos | `READY` |
| Responsables operativos | Pendientes de definición humana | `READY` |
| Autorización explícita | No otorgada | `NOT_APPLICABLE` |

Estados permitidos: `READY`, `BLOCKED`, `NOT_RUN`, `NOT_APPLICABLE`.

## Baseline no sensible

| Elemento | Baseline |
|---|---|
| Core Session | `OFF` |
| UBO Session | `AUTORIDAD ACTUAL` |
| `USE_CORE_SESSION` | `false` |
| `USE_CANONICAL_CAREER` | `false` |
| `USE_CANONICAL_ROOM` | `false` |
| Student / Admin | `OUTSIDE_SCOPE` |
| PWA | `ubo-academic-hub-v114` |

No se registran contraseñas, tokens, cookies, credenciales, dumps de almacenamiento ni datos académicos personales.

## Procedimiento futuro — no ejecutar en esta fase

1. Obtener aprobación explícita de los tres responsables.
2. Registrar el Run ID y confirmar baseline.
3. Confirmar el procedimiento de rollback.
4. Activar manualmente el canario solo si existe autorización formal.
5. Ejecutar exclusivamente escenarios Teacher y monitorear resultados no sensibles.
6. Ante CRITICAL, abortar; ante HIGH, abortar salvo aprobación explícita.
7. Registrar resultados, efectuar rollback si corresponde y validar Teacher, Student y Admin.
8. Cerrar la corrida sin reutilizar su evidencia para otra ejecución.

## Monitoreo y abort

Monitorear identidad, rol, creación/lectura/limpieza de sesión, rutas Teacher, ausencia de sesión, cambios de perfil y errores inesperados. No registrar información sensible.

Abort inmediato ante identidad o rol incorrectos, sesión cruzada/residual, privilegio elevado, acceso indebido, logout incompleto, pérdida de acceso válido, fallo crítico del adapter o `SessionPort`, afectación Student/Admin, modificación de datos o cambio inesperado del Core.

## Rollback y validación posterior

Rollback objetivo: `USE_CORE_SESSION=false`.

1. Desactivar canario y recargar aplicación.
2. Confirmar a UBO como autoridad.
3. Limpiar una sesión residual solo conforme al procedimiento aprobado.
4. Validar Teacher, Student y Admin.
5. Ejecutar regresiones y registrar el resultado no sensible.

La preparación queda `READY` porque el baseline, tests, abort y rollback están definidos. La autorización permanece `NOT_GRANTED`; por lo tanto el canario no puede comenzar.
