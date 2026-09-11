# Fase 1.71 — Servicio local seguro para consumo de UniEcosystemCore

**Clasificación:** `DEVELOPMENT_ONLY`
**Resultado:** `CORE_BROWSER_CONSUMPTION_READY` para la prueba técnica aislada.

## Problema y arquitectura

Fase 1.70 confirmó que Node puede importar el Core hermano, pero que `http://localhost:3000` no sirve archivos fuera de UBO. Esta fase conserva ambos repositorios separados:

```text
UBO Academic Hub (localhost:3000)
  └─ import ESM de desarrollo, CORS limitado
       └─ UniEcosystemCore real (127.0.0.1:3101)
```

El Core no importa UBO, no se copia dentro de UBO y no se modifica.

## Servidor elegido

`tools/core-dev-server.mjs` utiliza únicamente módulos estándar de Node. No se creó `package.json`, no se instalaron dependencias y no se alteró el servidor UBO existente. El proyecto UBO no posee manifiesto de paquetes; el proceso que atiende el puerto 3000 es Node, pero no existe configuración en el repositorio que permita extender su root de forma segura.

| Propiedad | Valor |
| --- | --- |
| Host | `127.0.0.1` exclusivamente |
| Puerto | `3101` |
| Root lógico | `C:\Users\shari\Desktop\UniEcosystemCore` |
| Recurso expuesto | Solo `/core/identity-snapshot.js` |
| Métodos | `GET`, `HEAD` |
| Escritura/API/uploads | No disponibles |
| Directorios/package.json/otros paths | `404` |
| Origen CORS permitido | Solo `http://localhost:3000` |
| Credenciales CORS | No habilitadas |

No hay wildcard CORS, escucha pública, listado de directorios ni acceso a carpetas padre. Las rutas no incluidas, incluida cualquier variante de traversal, no pertenecen a la whitelist y reciben `404`; un `Origin` no permitido recibe `403`.

## Uso de desarrollo

1. Iniciar UBO con su mecanismo local actual en `http://localhost:3000`.
2. En otra terminal local, desde UBO, ejecutar `node tools/core-dev-server.mjs`.
3. Abrir `http://localhost:3000/modules/demo/core-browser-consumption.html`.
4. El resultado exitoso es `IDENTITY_SNAPSHOT_BROWSER_IMPORT_OK · teacher-carlos-perez / TEACHER`.

La página es una prueba técnica aislada: no está enlazada al Selector, Student, Teacher ni Admin. No crea sesión ni modifica interfaz productiva.

## Falla y rollback

Si el servidor Core está apagado, la página informa `CORE_BROWSER_UNAVAILABLE`; UBO continúa funcionando porque ningún shell productivo importa el Core. El rollback consiste únicamente en detener el proceso local `node tools/core-dev-server.mjs` y, si se decide abandonar el mecanismo, eliminar los cuatro artefactos de desarrollo de esta fase en una tarea posterior autorizada. No hay flags, datos, PWA ni sesión que revertir.

## Pruebas

`tests/core-browser-consumption.test.js` inicia el servidor de forma efímera en loopback y comprueba:

- endpoint ESM y CORS para `http://localhost:3000`;
- denegación de origen arbitrario;
- denegación de paths externos/traversal;
- fallo no bloqueante al no existir servidor;
- ausencia de SessionPort, Authorization, `localStorage` y `sessionStorage` en el servidor.

`tests/core-local-consumption.test.js` conserva la validación Node de dependencia real, dirección UBO → Core y ausencia de copias.

## Límites explícitos

- Session permanece fuera (`USE_CORE_SESSION=false`).
- Authorization, guards, login, logout, navegación, Career y Room permanecen fuera.
- `service-worker.js` y `ubo-academic-hub-v115` no se modifican; Core no es un asset PWA.
- Esta prueba no activa el canario Identity ni vuelve Core autoridad.

## Siguiente fase

Con el import técnico ya servible en desarrollo, una fase posterior puede evaluar un observador runtime fail-open para Carlos, siempre que mantenga el import fuera de PWA, no altere las fuentes UBO y pruebe explícitamente la caída del servidor Core.
