# Room Core Adapter — UBO read-only

## Propósito y frontera

`services/adapters/core-room-repository-adapter.js` implementa una lectura institucional UBO hacia los contratos genéricos de UniEcosystemCore. La dependencia permitida es `UBO adapter → Core contract`; el Core no conoce fuentes, mappings ni datos UBO.

## Fuente, mapping y contrato

La fuente DEMO es `data/university/rooms.js` y el mapping explícito es `data/mappings/rooms-map.js`. El adapter implementa RepositoryPort con `list()` y `getById(id)` y crea RoomModel del Core.

| Campo UBO | Campo Core | Transformación | Obligatorio |
|---|---|---|---|
| `universityRooms[].id` | `roomId` | Debe coincidir con `roomIdMap[].roomId` | Sí |
| `universityRooms[].nombre` | `name` | Debe coincidir con `roomIdMap[].currentRoomName` | Sí |
| `universityRooms[].edificio` | `building` | Lectura directa | Sí |
| `universityRooms[].capacidad` | `capacity` | Lectura directa; RoomModel valida número finito no negativo | Sí |
| `roomIdMap[].status` | `status` | Único estado DEMO disponible | Sí |
| `universityRooms[].tipo` | `type` | Lectura directa opcional | No |
| Sin fuente | `campus`, `floor` | `null` opcional del modelo | No |

Un source o mapping inválido produce `TypeError` o `RangeError`; un ID no encontrado devuelve `null`.

## Read-only e aislamiento

El repository no expone métodos de escritura y toma un snapshot interno. No utiliza DOM, storage, red, sesión, autenticación ni autorización. No se importa desde `app.js`, no activa `USE_CANONICAL_ROOM` y no modifica datos, UI, navegación ni bridge.

## Relación con Room Bridge

El adapter traduce fuente a contrato. `room-migration-bridge.js` conserva exclusivamente la coexistencia/fallback legacy y permanece inactivo mientras el feature flag sea `false`.

## Pruebas

`core-room-repository-adapter.test.js` cubre RepositoryPort, listado, consulta, fuente vacía, not found, múltiples salas, datos y mappings inválidos, copias defensivas, snapshot determinista, read-only y aislamiento estático.
