# Checkpoint UBO previo a integración Core

## Motivo

Este checkpoint conserva el último estado validado de UBO Academic Hub antes de iniciar una integración progresiva con UniEcosystemCore. No integra `IdentityPort`, `SessionPort`, `AuthorizationContext` ni la política de permisos del Core.

## Estado validado

- **Student:** login legacy, `uboSession`, Inicio, navegación y logout de Sofía están operativos.
- **Teacher:** Carlos Pérez se resuelve solamente como `TEACHER`; su dashboard, cursos, guard y logout están operativos.
- **Admin:** Administrador UBO se resuelve solamente como `ADMIN`; su dashboard, gestión, guard y logout están operativos.
- **Demo identity:** se limita a `{ id, role }` en `sessionStorage`, se normaliza contra los usuarios demo y descarta propiedades extra.
- **Logout y guards:** el cierre limpia sesión demo y memoria; Teacher/Admin se deniegan tras logout o con identidad inválida.

## PWA y ESM

La PWA queda en `ubo-academic-hub-v114`. La prueba de precache confirma los entrypoints, CSS y grafos transitivos de Profesor/Admin sin imports faltantes ni ciclos.

## Flags y adapters

- `USE_CANONICAL_CAREER=false`.
- `USE_CANONICAL_ROOM=false`.
- Los adapters Career/Room permanecen read-only y no modifican el flujo visible legacy.

## Seguridad

La auditoría no detectó archivos `.env`, claves privadas, tokens de alta confianza, `node_modules`, logs o archivos temporales incluidos en este checkpoint. Los datos y credenciales incluidos son exclusivamente demo.

Los guards son controles frontend de navegación; no sustituyen autenticación, autorización ni controles de servidor reales.

## Core

UniEcosystemCore permanece independiente. Su commit observado antes del checkpoint UBO es `414eee6392afa54e93adcc4f6c42d3be08d4387a`. No se modifica ni se incluye en este commit.

## Hash y estado remoto

El hash completo del checkpoint se registra en el informe de la Fase 1.51 mediante `git rev-parse HEAD` después del único commit autorizado. El estado remoto se confirma con `main...origin/main` tras el push.

## Rollback conceptual

El hash de este commit constituye el punto de recuperación. Para volver a este estado, una fase posterior deberá evaluar el impacto y seleccionar explícitamente ese commit; este checkpoint no ejecuta `reset`, `restore` ni otra operación destructiva.

## Exclusiones

No forman parte de este checkpoint UniEcosystemCore, secretos, credenciales reales, archivos de entorno, `node_modules`, logs, artefactos temporales ni despliegues.

## Siguiente paso recomendado

La Fase 1.52 debe ser read-only y de diseño: definir el contrato de transición de identidad/sesión entre `uboSession`, demo identity y los ports del Core antes de conectar una ruta real.
