# Validación del grafo ESM frente al precache PWA

## Problema prevenido

Profesor y Administrativo son *shells* ESM independientes. Si un módulo local nuevo se importa desde uno de sus entrypoints y no se agrega al precache, el shell puede cargar en línea pero fallar sin conexión. Esta validación detecta esa divergencia antes de que llegue a una demostración.

## Alcance

La prueba [`tests/pwa-esm-precache.test.js`](../tests/pwa-esm-precache.test.js) analiza solamente UBO Academic Hub. No importa, modifica ni requiere UniEcosystemCore.

Entry points auditados:

- Profesor: `modules/professor/teacher-dashboard.js`
- Administrativo: `modules/admin/admin-dashboard.js`

También revisa los HTML y CSS directamente referenciados por cada shell:

- `modules/professor/teacher-dashboard.html` y `teacher-dashboard.css`
- `modules/admin/admin-dashboard.html` y `admin-dashboard.css`

## Descubrimiento del grafo

Desde cada entrypoint, la prueba recorre recursivamente imports y reexports ESM locales. Considera imports directos, transitivos y dinámicos con literal; resuelve rutas relativas, rutas raíz locales y extensiones `.js` omitidas cuando existe el archivo. Paquetes, URLs y otros imports externos quedan fuera del grafo porque no son assets locales del precache.

La prueba informa por separado:

- JavaScript transitivo.
- HTML del shell.
- CSS del shell.
- Imágenes u otros assets locales declarados de forma directa por el HTML o mediante `url(...)` local desde su CSS.

No mezcla estas categorías al comparar ni al diagnosticar.

## Normalización

Las rutas se comparan en formato relativo al repositorio: sin `./`, con separadores `/`, sin query string ni hash. Así `./modules/professor/teacher-dashboard.js` y su forma normalizada representan el mismo recurso. Para imports sin extensión se prueba la ruta exacta, luego `.js` e `index.js`.

## Extracción del precache

La prueba lee `service-worker.js` y busca automáticamente una colección explícita de assets que contenga simultáneamente los entrypoints de Profesor y Administrativo. No depende de que el identificador se llame `DEMO_SHELL_ASSETS`; el nombre encontrado se imprime como `PWA_PRECACHE_COLLECTION`.

Actualmente la colección detectada forma parte del shell offline introducido con `ubo-academic-hub-v113`. La prueba no edita el service worker, no incrementa su versión y no agrega assets automáticamente.

## Comparación y resultados

La prueba falla cuando un archivo del grafo ESM o un asset directo del shell no está en la colección de precache. Los mensajes principales son:

- `PROFESSOR_GRAPH_OK` y `ADMIN_GRAPH_OK`: la cobertura del shell está completa.
- `PWA_PRECACHE_COVERAGE_OK`: no hay faltantes.
- `IMPORT_MISSING`: un import ESM local apunta a un archivo inexistente.
- `PWA_PRECACHE_MISSING_ASSETS`: el archivo existe y pertenece al grafo, pero no está precacheado.
- `PWA_PRECACHE_COVERAGE_FAILED`: existe al menos una falla de cobertura o import.

Los ciclos de imports, imports repetidos y assets JavaScript del precache que no pertenecen a ninguno de los dos grafos se muestran como advertencias. No fallan por sí mismos, porque pueden corresponder a dependencias compartidas o a una futura ruta offline, pero deben revisarse.

La prueba además ejecuta una regresión en memoria: agrega conceptualmente `modules/professor/future-module.js` al grafo sin incorporarlo al precache y verifica que el comparador lo detecte. No crea archivos temporales ni modifica el repositorio.

## Ejecución

Desde la raíz de UBO Academic Hub:

```powershell
node tests/pwa-esm-precache.test.js
```

También se debe incluir en la suite de validación manual junto con `node --check service-worker.js` y las pruebas existentes.

## Qué hacer si falla

1. Revisar la categoría del error y la ruta exacta impresa.
2. Para `IMPORT_MISSING`, corregir o retirar el import en una fase de implementación separada.
3. Para `PWA_PRECACHE_MISSING_ASSETS`, confirmar que el asset debe estar disponible offline y actualizar el manifiesto PWA en una fase controlada.
4. Volver a ejecutar la prueba y validar online/offline en navegador.

La prueba solo detecta el problema: nunca modifica `service-worker.js` ni aplica una corrección automática.

## Limitaciones

El análisis es estático y cubre imports ESM con especificadores literales. No puede descubrir rutas calculadas en tiempo de ejecución, assets solicitados por APIs ni archivos que una aplicación genere dinámicamente. En CSS cubre `url(...)` locales de las hojas de estilo directamente declaradas por cada shell; no sigue `@import` remotos ni recursos creados dinámicamente.

## Rollback

Esta fase agrega solamente una prueba y documentación. Para revertirla se eliminan esos dos archivos; no requiere modificar el service worker, la aplicación estudiante, Profesor, Administrativo ni Core.
