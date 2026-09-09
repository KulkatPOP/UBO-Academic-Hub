# Auditoría del patrón Core ↔ Adapter — Fase 1.32

## A. Estado general

**OK CON ADVERTENCIAS.** El Career Repository Adapter implementa una frontera read-only correcta: UBO provee fuente y mapping, el adapter traduce, y UniEcosystemCore valida el contrato canónico. No hay conexión a UI, flags activos ni modificación de datos legacy.

```text
UBO Career Source → UBO Mapping → Career Repository Adapter → CareerModel → RepositoryPort
```

## B. RepositoryPort

El adapter devuelve un objeto congelado con `list()` y `getById(id)`. La prueba usa `isRepositoryPort()` del Core, por lo que confirma el contrato y no solo la coincidencia nominal de métodos. `getById` devuelve `null` ante un ID inexistente, conforme a la convención del port. No hay desviaciones ni fue necesario cambiar el contrato.

## C. CareerModel

CareerModel exige `careerId`, `name` y `status` como strings no vacíos; `facultyId` y `degreeType` son opcionales y quedan en `null` cuando la fuente no los provee. El modelo mantiene invariantes genéricos; no conoce IDs, nombres ni estados UBO.

| Validación | Clasificación | Responsable |
|---|---|---|
| `careerId`, `name`, `status` canónicos no vacíos | CORE INVARIANT | CareerModel Core |
| Fuente es un array y registro es objeto | INPUT/DATA_ERROR | Adapter UBO |
| `id` y `nombre` UBO presentes | INPUT/DATA_ERROR | Adapter UBO |
| ID y nombre coinciden exactamente con mapping | INSTITUTIONAL MAPPING | Adapter + mapping UBO |
| Estado disponible desde mapping | INSTITUTIONAL MAPPING | Mapping UBO |

El adapter repite la comprobación textual de los valores mapeados antes de invocar CareerModel para entregar errores de frontera precisos. Es una duplicación menor e intencional; CareerModel sigue siendo la autoridad de la invariante canónica.

## D. Mapping

| Origen UBO | Destino Core | Transformación | Obligatorio | Pérdida / validación |
|---|---|---|---|---|
| `universityCareers[].id` | `careerId` | Coincidencia exacta con `careerIdMap[].careerId` | Sí | Rechaza mapping ausente |
| `universityCareers[].nombre` | `name` | Coincidencia exacta con `careerIdMap[].currentCareer` | Sí | Rechaza mapping ausente |
| `careerIdMap[].status` | `status` | Estado DEMO ya definido por el mapping | Sí | Rechaza estado vacío |
| Sin fuente | `facultyId`, `degreeType` | `null` opcional del modelo | No | Datos no disponibles |
| `studentIds` | — | No existe relación equivalente en CareerModel | No | Se conserva fuera del contrato Career |

No se crean IDs, estados ni relaciones institucionales.

## E. Identidad

La identidad canónica de Career es `careerId`. En esta implementación el adapter exige que el ID de fuente y el ID del mapping coincidan; su formato sigue siendo institucional y opaco para el Core. La unicidad depende de la fuente/mapping UBO; CareerModel no asume un formato UBO.

## F. Read-only

El adapter no expone `create`, `save`, `update`, `delete`, `remove`, `insert` ni `write`. Construye un snapshot interno congelado, por lo que no modifica la fuente directa ni indirectamente.

## G. Pureza

No usa DOM, `window`, `document`, storage, cookies, red, XHR, WebSocket, APIs externas, sesión, autenticación ni policies. Sus dependencias son: fuente UBO, mapping UBO y CareerModel Core.

## H. Copias defensivas

`list()` y `getById()` devuelven nuevos objetos. Las pruebas mutan resultados y luego la fuente/mapping inyectados: las lecturas posteriores permanecen equivalentes al snapshot inicial. CareerModel no tiene estructuras anidadas; por ello no existe una estructura anidada canónica que copiar en este dominio.

## I. Determinismo

Para una misma fuente y mapping, el snapshot y cada lectura son equivalentes. El orden del catálogo se conserva desde la fuente; no hay tiempo, aleatoriedad, storage, red ni estado global mutable.

## J. Errores

No existe aún una taxonomía codificada común. La convención actual es `TypeError` para estructura/mapping inválidos y `null` para `NOT_FOUND` en `getById`.

| Situación | Clasificación | Resultado |
|---|---|---|
| Fuente no array | INPUT_ERROR | `TypeError` |
| Registro no objeto o incompleto | DATA_ERROR | `TypeError` |
| Mapping ausente o estado inválido | MAPPING_ERROR | `TypeError` |
| ID no existente | NOT_FOUND | `null` |
| Adapter no cumple port | CONTRACT_ERROR | `isRepositoryPort()` devuelve `false` |

## K. Adapter vs Model

El adapter traduce la representación UBO y hace cumplir la coincidencia institucional. CareerModel garantiza los invariantes canónicos. El adapter no añade reglas académicas ni amplía el modelo con campos UBO.

## L. Adapter vs Bridge

El adapter lee y traduce. `career-migration-bridge.js` controla coexistencia, flag y fallback de la aplicación legacy. El adapter no decide migración y el bridge actual no es reutilizado por este adapter.

## M. Adapter vs Service

`career-service.js` usa el adapter/mapping previo de UBO para casos de lectura del bridge legacy. El nuevo repository adapter es una integración aislada con el Core y no está conectado al service. No hay duplicación de consultas en ejecución, pero ambas rutas deberán reconciliarse antes de activar una migración.

## N. Generalización

El patrón reutilizable es: fuente institucional, mapping explícito, adapter de lectura, modelo canónico y port. Son genéricos el snapshot, `list`, `getById`, copias defensivas, `null` para no encontrado y la validación contractual. Son específicos de Career los campos, la coincidencia `id`/`nombre`, el estado desde mapping y la pérdida de `studentIds`.

No se recomienda todavía una factory, superclase o adapter genérico: Room, Student y Course tienen relaciones y pérdidas distintas que deben auditarse antes.

## O. Duplicación

La coexistencia de `data/models/career-model.js` de UBO y CareerModel del Core es **intencional durante la transición**: el servicio y bridge legacy siguen consumiendo el modelo UBO, mientras el nuevo adapter consume Core. Es una advertencia de mantenimiento, no una regresión; no se eliminó ni conectó automáticamente.

## P. Dependencias

La dependencia física local es explícita: `services/adapters/core-career-repository-adapter.js` importa CareerModel desde `../../../UniEcosystemCore`. Core no importa UBO, datos UBO ni mappings UBO. No se detectaron ciclos.

## Q. Contaminación Core

El escaneo de `core/`, `data/` y `tests/` del Core produjo `CORE_RUNTIME_ISOLATION_OK`. Referencias a fronteras Core/UBO solo existen en documentación permitida.

## R. Tests

La suite del adapter cubre contract port, `list`, `getById`, not found, fuente vacía, múltiples registros, top-level source inválida, registros incompletos, mapping inválido, copias defensivas, snapshot, determinismo, read-only y aislamiento estático. También se ejecuta un test UBO que falla si el runtime del Core introduce imports hacia UBO.

## S. Regresión

Las 9 suites ESM de UBO y las suites `npm test`/`npm run check` del Core pasan. `app.js` no cambió y ambos feature flags canónicos continúan en `false` dentro de `config/institution.js`.

## T. Seguridad

No se detectaron API keys, tokens, passwords, secrets ni credenciales reales. El adapter no autentica.

## U. Problemas

No se detectaron problemas funcionales. La única advertencia es la coexistencia intencional de dos modelos/rutas Career durante la transición.

## V. Riesgos

Activar una migración sin decidir cuál modelo/service será la fuente canónica puede causar divergencia. Una futura evolución debe conservar mappings explícitos y no derivar estados o relaciones inexistentes.

## W. Decisiones futuras

Definir gobernanza de IDs y estados de Career, estrategia de empaquetado de la dependencia local, y plan de consolidación de la ruta service/bridge una vez aprobada la migración read-only.

## X. Recomendación Fase 1.33

Auditar Room contra este patrón antes de crear un adapter nuevo. Confirmar primero campos, mapping, relaciones, pérdida de información y responsabilidad del bridge existente.
