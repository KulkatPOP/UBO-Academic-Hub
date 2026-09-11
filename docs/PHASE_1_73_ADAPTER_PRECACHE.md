# Fase 1.73 — Precache seguro del Identity Adapter

**Resultado:** `ADAPTER_PRECACHE_READY`

## Problema de Fase 1.72

El shell Profesor no podía importar el adapter sin añadir un módulo UBO faltante al precache. Esta fase no activa el canario ni modifica Teacher; prepara únicamente los assets locales de UBO para una futura carga controlada.

## Grafo del adapter

Punto de entrada: `services/adapters/core-identity-adapter.js`.

| Clase | Rutas |
| --- | --- |
| Assets UBO | `services/adapters/core-identity-adapter.js`, `core/demo-identity-session.js`, `core/session.js`, `data/users.js` |
| Import externo | `../../../UniEcosystemCore/core/identity-snapshot.js` |

Los tres módulos transitivos UBO ya estaban en `DEMO_SHELL_ASSETS`. Solo faltaba el adapter. El Core externo se detecta y se registra como externo, pero no se agrega al grafo local ni a PWA.

## Cambio PWA

Se agregó exclusivamente:

```text
services/adapters/core-identity-adapter.js
```

a `DEMO_SHELL_ASSETS`. No se modificó `OFFLINE_DOCUMENTS`, la estrategia de caché ni el fallback documental. El cache cambió de `ubo-academic-hub-v115` a `ubo-academic-hub-v116` porque cambió el precache.

No se agregaron rutas de Core, `127.0.0.1:3101`, `identity-snapshot.js` externo ni `UniEcosystemCore` al Service Worker.

## Validación automática

`tests/pwa-esm-precache.test.js` ahora valida el `ADAPTER_GRAPH` de forma recursiva:

- módulos UBO y rutas normalizadas;
- imports locales inexistentes;
- ciclos y duplicados;
- presencia de todos los assets UBO en precache;
- exclusión explícita de Core externo;
- simulación en memoria de `services/adapters/future-adapter-module.js`, que debe detectar cobertura faltante.

Resultados esperados:

```text
ADAPTER_GRAPH_OK
ADAPTER_IMPORT_GRAPH_CYCLE_FREE
ADAPTER_PRECACHE_REGRESSION_SIMULATION_OK
CORE_NOT_INCLUDED_IN_PWA_OK
PWA_PRECACHE_COVERAGE_OK
```

## Browser y offline

La página técnica `modules/demo/adapter-browser-load.html` comprueba la evaluación del adapter sin conectar el canario. Con el contrato actual, el adapter UBO se sirve desde UBO, pero su import estático de Core aún requiere una ruta HTTP servible por el mecanismo de desarrollo; el resultado controlado puede ser `ADAPTER_BROWSER_LOAD_REQUIRES_CORE`.

Esto no es una regresión offline: UBO sigue funcional y el Core de desarrollo continúa deliberadamente fuera de PWA. Identity Core no debe funcionar offline en esta etapa.

## Límites mantenidos

- Canary apagado; Teacher no se modifica.
- Session, Authorization, Career y Room permanecen fuera.
- `USE_CORE_SESSION=false`, `USE_CANONICAL_CAREER=false`, `USE_CANONICAL_ROOM=false`.
- Student, Admin, datos y guards permanecen intactos.
- Core sigue independiente y sin modificaciones.

## Rollback y siguiente fase

El rollback de esta fase consiste en retirar solo la entrada del adapter de `DEMO_SHELL_ASSETS` y volver a un cache nuevo aprobado; no debe usarse reset destructivo.

La siguiente fase puede rediseñar la carga browser del adapter para apuntar explícitamente al Core local de desarrollo, sin copiar Core ni otorgarle autoridad runtime. Antes de activar cualquier canario deberán repetirse pruebas PWA, fail-open y de navegación.
