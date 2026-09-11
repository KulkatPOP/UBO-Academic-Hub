# Checklist oficial de aprobación previa — Core Session Canary / Teacher

> **ESTADO DEL CHECKLIST: NOT_APPROVED**
> Este checklist prepara una futura activación manual. Su resultado `APPROVED_FOR_MANUAL_CANARY` **no activa** el canario ni cambia `USE_CORE_SESSION`.

## A. Identificación

- [ ] Run ID definido.
- [ ] Perfil Teacher confirmado.
- [ ] Carlos Pérez confirmado.
- [ ] `teacher-carlos-perez` confirmado.
- [ ] `TEACHER` confirmado.
- [ ] Operador definido.
- [ ] Responsable técnico definido.
- [ ] Responsable del proyecto definido.
- [ ] Responsable de pruebas definido.

## B. Checkpoints

- [ ] UBO checkpoint `ca238a93c2cc15bbf597e643cab26bd02aa42128` confirmado.
- [ ] Core checkpoint `414eee6392afa54e93adcc4f6c42d3be08d4387a` confirmado.
- [ ] PWA `ubo-academic-hub-v114` confirmada.
- [ ] Sin cambios no autorizados.

## C. Tests

- [ ] Identity Adapter e IdentitySnapshot.
- [ ] Shadow.
- [ ] Session y logout.
- [ ] Guards.
- [ ] Coexistence.
- [ ] Canary design.
- [ ] Canary operations.
- [ ] Canary run record.
- [ ] PWA/precache.
- [ ] Suite completa UBO.
- [ ] Suite completa Core.

## D. Configuración

- [ ] `USE_CORE_SESSION=false` antes del inicio.
- [ ] `USE_CANONICAL_CAREER=false`.
- [ ] `USE_CANONICAL_ROOM=false`.
- [ ] No existe configuración paralela de canario.
- [ ] No existe activación automática.

## E. Alcance

- [ ] Solo Teacher.
- [ ] Student fuera.
- [ ] Admin fuera.
- [ ] Career fuera.
- [ ] Room fuera.
- [ ] Authorization fuera.
- [ ] Core production session: FUTURO CANARY, fuera del runtime actual.

## F. Seguridad y protección de información

- [ ] No se registrarán contraseñas.
- [ ] No se registrarán tokens.
- [ ] No se registrarán cookies.
- [ ] No se registrará sessionStorage completo.
- [ ] No se registrará localStorage completo.
- [ ] No se registrarán datos académicos innecesarios.
- [ ] No existen defaults permisivos.
- [ ] No existe escalamiento por campos adicionales.

## G. Rollback

- [ ] Procedimiento manual disponible.
- [ ] `USE_CORE_SESSION=false` definido como rollback.
- [ ] UBO puede recuperar autoridad.
- [ ] Teacher puede validarse después del rollback.
- [ ] Student puede validarse después del rollback.
- [ ] Admin puede validarse después del rollback.
- [ ] Sesión Core residual puede detectarse.
- [ ] Identidad residual puede detectarse.

## H. Abort

- [ ] CRITICAL → abort inmediato.
- [ ] HIGH → abort salvo aprobación explícita.
- [ ] No existe fallback permisivo.
- [ ] No existe fallback automático.

## I. Aprobación

- [ ] Responsable técnico aprueba.
- [ ] Responsable del proyecto aprueba.
- [ ] Responsable de pruebas aprueba.

Valores permitidos: `NOT_APPROVED`, `APPROVED_FOR_MANUAL_CANARY`, `BLOCKED`.

## Regla de aprobación

Solo puede marcarse `APPROVED_FOR_MANUAL_CANARY` si todos los elementos críticos están completos. Se debe marcar `BLOCKED` ante contradicción crítica, rollback no probado, identidad o scope ambiguo, checkpoint faltante o pruebas faltantes.

La aprobación no habilita el canario: ninguna corrida puede modificar esta checklist para tratar una aprobación como activación.
