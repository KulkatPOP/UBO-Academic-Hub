# Auditoría de frontera Core / Consumer — Fase 1.42

## A. Estado general

**OK CON ADVERTENCIAS.** La separación física y la dirección de dependencias se mantienen correctamente. No se movieron, copiaron ni fusionaron proyectos.

## B. Separación física

- UBO: `C:\Users\shari\Desktop\Ubo app academico`, repositorio propio en `main...origin/main`.
- Core: `C:\Users\shari\Desktop\UniEcosystemCore`, repositorio propio en `master...origin/master`.

## C. Core

Core permanece en `414eee6` sin cambios funcionales. Su código ejecutable no contiene dependencias hacia UBO, DOM, storage, red, APIs institucionales ni secretos. Resultado: `CORE_PRODUCT_ISOLATION_OK` y `CORE_RUNTIME_ISOLATION_OK`.

## D. UBO

UBO mantiene UI, configuración, datos, mappings, adapters y bridges. Las referencias al Core se limitan a los adapters Career/Room y sus pruebas, dirección permitida para un consumidor institucional.

## E. Career

Career utiliza fuente UBO, mapping UBO, `core-career-repository-adapter.js`, `CareerModel` y `RepositoryPort` del Core. El bridge usa legacy con el flag OFF y el repositorio adaptado con el flag ON, con fallback y sin escritura.

## F. Room

`core-room-repository-adapter.js` implementa el mismo patrón read-only hacia `RoomModel` y `RepositoryPort`. Room está preparado, cubierto por test unitario y no fue activado.

## G. Dirección de dependencias

```text
UBO -> adapter -> UniEcosystemCore
```

No se detectó `Core -> UBO` en código ejecutable.

## H. Aislamiento

Career/Room no usan DOM, storage, red, sesión, autenticación ni autorización. Core sigue independiente de la institución consumidora.

## I. Feature flags y rollback

- `USE_CANONICAL_CAREER=false` al finalizar.
- `USE_CANONICAL_ROOM=false` durante toda la fase.
- Career ON fue validado en Inicio; el rollback OFF restauró la visualización legacy sin pérdida de datos ni errores de consola.

## J. Tests

- UBO: 10 suites `*.test.js`, `node --check app.js` y contratos Career/Room: correctos.
- Core: `npm test`, `npm run check` y 29 verificaciones sintácticas: correctos.

## K. Perfiles DEMO

Los perfiles de Estudiante, Profesor y Administrativo permanecen intactos. Sus servicios devuelven Sofía Martínez Rojas, Carlos Pérez y Administrador UBO respectivamente. No se registran credenciales aquí.

## L. Dominios bloqueados

Course, Enrollment, Grade, Attendance, Student, Teacher, Schedule, Evaluation y Material no fueron modificados. Tampoco se conectó autorización institucional.

## M. Problemas y riesgos

La dependencia al Core sigue siendo física/local, el Core es privado y la API continúa en evolución. El shell local de las pantallas demo aisladas Profesor/Admin puede requerir una auditoría específica de carga/PWA; no se modificó por estar fuera de este alcance.

## N. Estado final y recomendación

No hubo commit, push, deploy ni publicación npm. La Fase 1.43 debería auditar la carga del shell/PWA de los módulos demo aislados y definir una estrategia de dependencia local versionada antes de ampliar otro dominio canónico.
