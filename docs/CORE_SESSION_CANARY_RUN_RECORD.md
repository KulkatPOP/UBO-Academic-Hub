# Acta manual de corrida — Core Session Canary / Teacher

> **STATUS: TEMPLATE_ONLY**
> **CANARY_STATUS: NOT_ACTIVATED**

Esta plantilla registra una futura corrida manual aprobada. No representa una ejecución real, no activa `USE_CORE_SESSION` y no autoriza un canario por sí misma.

## Identificación

| Campo | Valor |
|---|---|
| CANARY_RUN_ID | `[POR DEFINIR]` |
| CANARY_PROFILE | `TEACHER` |
| PROFILE_ID | `teacher-carlos-perez` |
| ROLE | `TEACHER` |
| DATE | `[POR DEFINIR]` |
| OPERATOR | `[POR DEFINIR]` |
| TECHNICAL_APPROVER | `[POR DEFINIR]` |
| PROJECT_APPROVER | `[POR DEFINIR]` |
| TEST_APPROVER | `[POR DEFINIR]` |
| UBO_CHECKPOINT | `ca238a93c2cc15bbf597e643cab26bd02aa42128` |
| CORE_CHECKPOINT | `414eee6392afa54e93adcc4f6c42d3be08d4387a` |
| PWA_VERSION | `ubo-academic-hub-v114` |

No registrar nombres reales si no fueron aprobados para esa corrida.

## Estado inicial y alcance

| Elemento | Estado requerido antes de una futura ejecución |
|---|---|
| USE_CORE_SESSION | `false` |
| Career | `false` |
| Room | `false` |
| Student | `OUTSIDE_SCOPE` |
| Admin | `OUTSIDE_SCOPE` |
| Teacher | `CANARY_SCOPE` |
| Teacher esperado | `teacher-carlos-perez` / `TEACHER` |
| Estado Core inicial | `SIN SESIÓN CORE` |

## Precheck

| Verificación | Resultado | Observación |
|---|---|---|
| Core checkpoint confirmado | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| UBO checkpoint confirmado | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| UBO tests correctos | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| Core tests correctos | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| `node --check` correcto | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| PWA y precache correctos | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| Identity Adapter / Shadow / Coexistence / Procedure | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| Student, Teacher y Admin correctos | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| Career y Room OFF | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |
| Rollback disponible; sin cambios no autorizados | `[PASS / FAIL / NOT_RUN]` | `[POR REGISTRAR]` |

## Baseline no sensible

| Dato | Valor esperado | Observado |
|---|---|---|
| Identidad Teacher | `teacher-carlos-perez` | `[POR REGISTRAR]` |
| Rol Teacher | `TEACHER` | `[POR REGISTRAR]` |
| Sesión inicial | `SIN SESIÓN CORE` | `[POR REGISTRAR]` |
| Student | `FUERA DE ALCANCE` | `[POR REGISTRAR]` |
| Admin | `FUERA DE ALCANCE` | `[POR REGISTRAR]` |
| PWA / checkpoints | Valores de identificación anteriores | `[POR REGISTRAR]` |

## Matriz de ejecución

Resultados permitidos: `PASS`, `FAIL`, `ABORT`, `NOT_RUN`, `NOT_APPLICABLE`.

| # | Escenario | Esperado | Observado | Estado | Severidad | Evidencia |
|---|---|---|---|---|---|---|
| 1 | Teacher identity resolution | ID y rol equivalentes | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 2 | Teacher session creation | Sesión equivalente | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 3 | Teacher session retrieval | Identidad recuperable | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 4 | Teacher dashboard | Acceso vigente correcto | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 5 | Teacher direct route | Guard/redirección correcta | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 6 | Teacher logout | Ambas fronteras nulas | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 7 | Teacher access after logout | Acceso denegado | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 8 | Teacher → Student | Espejo Teacher limpio | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 9 | Teacher → Admin | Espejo Teacher limpio | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 10 | Student → Teacher | Scope Teacher exclusivo | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 11 | Admin → Teacher | Scope Teacher exclusivo | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 12 | Adapter failure | Abort manual | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 13 | SessionPort failure | Abort manual | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 14 | Identity mismatch | Abort manual | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 15 | Role mismatch | Abort manual | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 16 | Stale session | Abort manual | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 17 | Corrupt identity | Abort manual | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 18 | Unknown role | Abort manual | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |
| 19 | Repeated login/logout | Determinista, sin residuo | `[POR REGISTRAR]` | `NOT_RUN` | `[POR DEFINIR]` | `[POR REGISTRAR]` |

## Severidades

- **CRITICAL:** escalamiento, identidad incorrecta, sesión cruzada, acceso indebido, logout incompleto o rol incorrecto. Abort inmediato.
- **HIGH:** fallo de Identity Adapter o SessionPort, pérdida de acceso válido o navegación incorrecta. Abort salvo aprobación explícita.
- **MEDIUM:** warning funcional no crítico. Documentar y evaluar.
- **LOW:** warning documental/no funcional. Documentar.

## ABORT RECORD

| Campo | Valor |
|---|---|
| Abort occurred | `[YES / NO]` |
| Reason | `[POR REGISTRAR]` |
| Severity | `[CRITICAL / HIGH / MEDIUM / LOW]` |
| Detected at | `[POR REGISTRAR]` |
| Action | `[POR REGISTRAR]` |
| Rollback executed | `[YES / NO]` |

Una falla **CRITICAL** no puede registrarse como `PASS`.

## ROLLBACK RECORD

| Campo | Valor |
|---|---|
| Previous authority | `UBO` |
| Rollback target | `USE_CORE_SESSION=false` |
| Rollback executed | `[YES / NO]` |
| Teacher validated | `[ ]` |
| Student validated | `[ ]` |
| Admin validated | `[ ]` |
| Residual Core session | `[YES / NO]` |
| Residual demo identity | `[YES / NO]` |
| Final runtime authority | `[POR REGISTRAR]` |

## Validación post-rollback

- [ ] Student funciona.
- [ ] Teacher funciona.
- [ ] Admin funciona.
- [ ] Teacher sin sesión queda rechazado.
- [ ] Admin sin sesión queda rechazado.
- [ ] Student conserva su flujo.
- [ ] No existe sesión Core residual.
- [ ] No existe identidad residual.
- [ ] No existe escalamiento.
- [ ] No hubo modificación de datos.

## FINAL DECISION

Valores permitidos: `NOT_RUN`, `SUCCESS`, `ABORTED`, `ROLLED_BACK`, `DO_NOT_CONTINUE`.

**Valor de esta plantilla:** `NOT_RUN`

No marcar `SUCCESS` si existe un CRITICAL sin resolver, rollback no validado, afectación de Student/Admin o escalamiento.

## Trazabilidad y protección de información

Artefactos a comprobar: Identity Adapter, Session shadow, Session coexistence, Canary procedure, PWA, UBO tests y Core tests.

Está prohibido incluir contraseñas, tokens, cookies, credenciales, secretos, dumps completos de almacenamiento, datos personales innecesarios o contenido académico sensible.

## CANARY RUN HISTORY

| Run | CANARY_RUN_ID | Estado | Referencia de acta |
|---|---|---|---|
| Run #1 | `[POR DEFINIR]` | `NOT_RUN` | `[POR DEFINIR]` |
| Run #2 | `[POR DEFINIR]` | `NOT_RUN` | `[POR DEFINIR]` |
| Run #3 | `[POR DEFINIR]` | `NOT_RUN` | `[POR DEFINIR]` |

Cada corrida futura requiere un identificador y resultados independientes; nunca reutilizar resultados de otra corrida.
