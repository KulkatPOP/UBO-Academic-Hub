# Fase 1.41 — Piloto de integración Career

## A. Objetivo

Validar, de forma local, reversible y de solo lectura, que UBO Academic Hub puede resolver la carrera de un estudiante mediante el contrato genérico de UniEcosystemCore. El alcance queda limitado al dominio `Career`.

## B. Estado inicial

- UBO: `main` en `3b37a8c5cd140745246f5733265813ad549b0ed2` (`origin/main`).
- Core: `master` en `414eee6392afa54e93adcc4f6c42d3be08d4387a` (`origin/master`).
- `USE_CANONICAL_CAREER=false` y `USE_CANONICAL_ROOM=false`.
- La ruta legacy sigue siendo `student().career` en la aplicación UBO.

## C. Adapter utilizado

Se reutiliza `services/adapters/core-career-repository-adapter.js`; no se creó un segundo adapter. Implementa `RepositoryPort` mediante `list()` y `getById()`, transforma únicamente `data/university/careers.js` más `data/mappings/careers-map.js`, y construye `CareerModel` desde el Core local.

El adapter toma un snapshot interno, retorna copias defensivas, retorna `null` ante un ID inexistente y rechaza fuentes, registros o mappings inválidos con `TypeError`. No expone operaciones de escritura ni usa DOM, storage, red, sesión, autenticación o autorización.

## D. Flujo de integración

```text
Fuente Career UBO
  -> mapping Career UBO
  -> createUboCareerRepository / RepositoryPort
  -> CareerModel de UniEcosystemCore
  -> career-migration-bridge read-only
  -> consumidor UBO
```

El bridge ahora usa el repositorio adaptado como lector canónico por defecto. La dependencia es local y unidireccional: `UBO -> adapter -> Core`. El Core no importa UBO.

## E. Core utilizado

Se usa el checkout local `C:\Users\shari\Desktop\UniEcosystemCore`, sin paquete npm, sin cambio a `private:true`, sin cambios funcionales del Core y sin publicación de paquete.

## F. Flag inicial

Ambos flags se verificaron inicialmente en `false`. Room no se activó durante el piloto.

## G. Prueba legacy (OFF)

Con `USE_CANONICAL_CAREER=false`, la aplicación cargó el perfil de Sofía y mostró `Ingeniería Informática`; no se consultó el camino canónico. Login/sesión existente, Dashboard, navegación y perfil conservaron su comportamiento visible.

## H. Activación canónica (ON)

Se activó temporalmente `USE_CANONICAL_CAREER=true` en `config/institution.js`, se recargó `http://localhost:3000` y se verificó:

- Inicio visible con `Buenas noches, Sofía` e `Ingeniería Informática`.
- Perfil visible con `Sofía Martínez Rojas`, `Ingeniería Informática` y `5° semestre · Diurna`.
- Consola sin errores ni warnings de fallback.
- `career-informatica` resuelve `Ingeniería Informática`.
- ID inexistente devuelve `null` desde el RepositoryPort.
- Una mutación externa sobre `list()` no modifica el snapshot posterior.

## I. Resultados y regresión

La activación canónica no cambió nombres ni datos visibles de carrera. El resultado de la suite UBO fue igual antes y después del ajuste: 10 tests correctos. No se modificaron notas, asistencia, matrícula, cursos ni ningún otro dominio.

## J. Perfiles DEMO verificados

- Estudiante: Sofía Martínez Rojas, visible en Inicio y Perfil.
- Profesor: `getTeacherProfile()` devuelve Carlos Pérez; sus cursos y resumen existen.
- Administrativo: `getAdminProfile()` devuelve Administrador UBO; existen estadísticas institucionales.

No se modificaron usuarios, contraseñas ni credenciales; este documento no las registra.

## K. Rollback

Después de la prueba ON, `USE_CANONICAL_CAREER` se devolvió a `false` y se recargó la aplicación. Inicio siguió mostrando a Sofía y su carrera legacy, sin errores de consola ni pérdida de datos. `USE_CANONICAL_ROOM` permaneció siempre en `false`.

## L. Tests

- UBO: `node --check app.js`, `node --check services/career-migration-bridge.js` y las 10 suites `*.test.js`: correctas.
- Career: adapter, bridge, inexistente, fuente/mapping inválidos, snapshot defensivo, determinismo y read-only: correctos.
- Perfiles demo mediante servicios: correctos.
- Core: `npm test` y `npm run check`: correctos.

## M. Aislamiento

`CORE_PRODUCT_ISOLATION_OK` y `CORE_RUNTIME_ISOLATION_OK`. El Core no adquirió imports UBO, DOM, storage, red, APIs institucionales ni credenciales. El adapter UBO permanece separado de Identity, Session, Authorization Context y Permission Policy.

## N. Git

Core permanece en el checkpoint `414eee6`, sin modificaciones. UBO conserva su base `3b37a8c`; sus archivos no rastreados previos de adapters, pruebas y documentación permanecieron intactos. No hubo commit, push ni deploy en esta fase.

## O. Archivos modificados

- `services/career-migration-bridge.js`: el lector canónico por defecto pasa a ser el RepositoryPort adaptado al Core.
- `docs/CAREER_INTEGRATION_PILOT.md`: este informe.

`config/institution.js` se modificó solo temporalmente para la prueba ON y terminó restaurado sin cambios persistentes.

## P. Problemas y riesgos

El shell de `http://localhost:3000` cargó la aplicación estudiante correctamente, pero las vistas demo aisladas de Profesor/Admin quedaron en estado inicial de carga durante la comprobación visual, sin error registrado por el navegador. Sus servicios y perfiles se validaron por Node. Es una advertencia de shell/caché local no relacionada con Career y queda fuera de alcance para no modificar esos módulos.

Persisten los límites esperados del piloto: dependencia física local al Core, API pública aún en evolución, Core privado y autorización institucional todavía separada.

## Q. Estado final y recomendación

- `USE_CANONICAL_CAREER=false`.
- `USE_CANONICAL_ROOM=false`.
- Estado: **OK CON ADVERTENCIAS**.

Para la Fase 1.42 se recomienda auditar el shell/PWA que sirve módulos demo aislados y, solo después, definir una estrategia de dependencia local versionada o de package privado para el Core. No activar Room ni ampliar dominios antes de ese diagnóstico.
