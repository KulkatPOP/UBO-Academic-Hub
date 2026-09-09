# Career Core Adapter — UBO read-only

## Propósito y frontera

`services/adapters/core-career-repository-adapter.js` demuestra que UBO puede consumir los contratos genéricos de UniEcosystemCore sin que el Core conozca UBO. La dirección permitida es `UBO adapter → Core contract`; el Core no importa datos, mappings, configuración ni código de UBO.

## Fuente y contrato

La fuente DEMO es `data/university/careers.js`; el mapping explícito es `data/mappings/careers-map.js`. El adapter implementa el contrato `RepositoryPort` del Core con `list()` y `getById(id)`, y crea resultados compatibles con `CareerModel` del Core.

| Campo UBO | Campo Core | Origen y transformación | Obligatorio | Pérdida |
|---|---|---|---|---|
| `universityCareers[].id` | `careerId` | Debe coincidir con `careerIdMap[].careerId` | Sí | No |
| `universityCareers[].nombre` | `name` | Debe coincidir con `careerIdMap[].currentCareer` | Sí | No |
| `careerIdMap[].status` | `status` | El mapping aprobado aporta el único estado DEMO disponible | Sí | No |
| Sin fuente disponible | `facultyId`, `degreeType` | Valores opcionales del contrato quedan en `null` | No | Sí, datos no disponibles |

No se inventan IDs, nombres, estados, relaciones ni reglas. Un registro sin estructura válida o sin mapping exacto se rechaza con `TypeError`; `getById` de un ID inexistente devuelve `null`, según RepositoryPort.

## Read-only y copias defensivas

El repository solo expone `list()` y `getById()`. No contiene `create`, `update`, `delete` ni `save`; no usa DOM, storage, red, API externa, sesión ni autenticación. Al construirse toma un snapshot interno y cada lectura entrega una copia: mutar el resultado o la fuente inyectada después no altera las lecturas posteriores.

## Estado de integración

No se importa desde `app.js`, no se modifica la UI, no se activa `USE_CANONICAL_CAREER` y el bridge legado permanece intacto. Esta fase no migra datos visibles ni producción.

## Pruebas

`services/adapters/core-career-repository-adapter.test.js` cubre listado, búsqueda, ID inexistente, fuente vacía, múltiples carreras, determinismo, snapshots defensivos, errores de fuente/mapping y ausencia de escritura. `tests/core-runtime-isolation.test.js` falla si el runtime del Core introduce un import hacia UBO.
