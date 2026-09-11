# Fase 1.70 — Preparación segura de dependencia ESM local del Core

**Fecha:** 2026-09-09
**Resultado:** `CORE_LOCAL_CONSUMPTION_NOT_READY` para navegador/runtime.
**Resultado Node:** `CORE_NODE_CONSUMPTION_OK`.

## A. Problema heredado de Fase 1.69

El adapter UBO `services/adapters/core-identity-adapter.js` puede importar el Core mediante filesystem en Node, pero su referencia alcanza el repositorio hermano `C:\Users\shari\Desktop\UniEcosystemCore`. Desde el host web UBO, ese archivo no pertenece al root servido por `http://localhost:3000`.

La comprobación HTTP de `/UniEcosystemCore/core/identity-snapshot.js` devuelve `404`. Por ello un import ESM runtime de Profesor no sería servible ni compatible con el precache actual.

## B. Separación física y estado de manifiestos

| Proyecto | Ubicación | Manifiesto | Estado |
| --- | --- | --- | --- |
| UBO Academic Hub | `C:\Users\shari\Desktop\Ubo app academico` | No existe `package.json` | App estática ESM servida localmente. |
| UniEcosystemCore | `C:\Users\shari\Desktop\UniEcosystemCore` | `package.json` presente | `name: uniecosystem-core`, `version: 0.1.0`, `private: true`, `type: module`. |

Core no declara `exports`, `files`, `engines`, `dependencies` ni `devDependencies`. Sigue siendo un repositorio ESM privado, independiente y no publicado.

## C. Opciones evaluadas

| Opción | Decisión | Motivo |
| --- | --- | --- |
| npm público | Descartada | Requiere publicación; fuera de alcance. |
| npm privado | Descartada en esta fase | Requiere registry/publicación o infraestructura adicional. |
| Git privado fijado a SHA | Diferida | UBO no tiene manifiesto ni gestor de dependencias. |
| `file:` local | Diferida | Requiere introducir `package.json`/instalación en UBO, sin convención existente. |
| Workspace/monorepo | Descartada | Contradice la separación física solicitada. |
| Copiar Core | Descartada | Duplicaría contratos y rompería la frontera de repositorios. |
| Servidor compartido de desarrollo | Recomendado para evaluar después | Debe diseñarse como infraestructura explícita; no se crea automáticamente. |

No se creó `package.json` en UBO. Resultado explícito: `LOCAL_DEPENDENCY_BLOCKED_BY_NO_UBO_PACKAGE_MANIFEST`.

## D. Node versus navegador

Node puede resolver el Core localmente mediante una URL `file:` a la ruta real del repositorio hermano. El test `tests/core-local-consumption.test.js` importa el `IdentitySnapshot` real y construye, de modo determinista e inmutable:

```text
teacher-carlos-perez / TEACHER
```

El navegador no puede resolver esa misma ruta porque el servidor UBO no expone el repositorio Core y una ruta HTTP equivalente da 404. Que Node funcione no demuestra disponibilidad de navegador.

## E. Garantías de aislamiento

El test nuevo verifica:

- Core real presente en la ubicación local esperada;
- error explícito si cambia esa ubicación;
- construcción de `IdentitySnapshot` para Carlos;
- determinismo e inmutabilidad;
- ausencia de una copia de Core o de `identity-snapshot.js` dentro de UBO;
- ausencia de imports Core → UBO en el código JavaScript de Core;
- dirección de dependencia únicamente UBO → Core durante pruebas Node.

No se copió, movió, publicó ni modificó Core.

## F. Identity Adapter y canary

El adapter existente se mantiene intacto. El canario Identity de Fase 1.69 continúa **NOT_ACTIVE** en runtime. No hay import nuevo desde Teacher, Admin, Student, login, guards, router ni sesión.

## G. PWA, sesión y autorización

- `service-worker.js` no se modificó en esta fase; continúa `ubo-academic-hub-v115`.
- Core no se agregó al precache.
- `USE_CORE_SESSION=false`.
- `USE_CANONICAL_CAREER=false`.
- `USE_CANONICAL_ROOM=false`.
- SessionPort y Authorization Core siguen fuera de runtime.

## H. Riesgos y requisitos para Fase 1.71

Antes de un canario runtime se requiere una decisión explícita de distribución del Core que sea servible por el host de UBO, mantenga repositorios separados y tenga contrato de versión reproducible. Alternativas válidas para evaluar son un paquete privado versionado o un servidor/desarrollo que exponga Core de forma explícita y verificable.

La siguiente fase debe diseñar esa infraestructura y su seguridad PWA antes de cambiar shells UBO. No debe copiar Core, crear un monorepo ni activar Identity, Session o Authorization como atajo.

## I. Resultado

```text
CORE_NODE_CONSUMPTION_OK
CORE_BROWSER_CONSUMPTION_NOT_READY
LOCAL_DEPENDENCY_BLOCKED_BY_NO_UBO_PACKAGE_MANIFEST
NO_CORE_COPY_IN_UBO
NO_UBO_IMPORT_IN_CORE
ONE_WAY_DEPENDENCY_DIRECTION_OK
CORE_PRODUCT_ISOLATION_OK
CORE_RUNTIME_ISOLATION_OK
```

UBO continúa siendo la autoridad y no se alteró comportamiento visible, PWA, Student, Teacher, Admin, datos, sesión ni autorización.
