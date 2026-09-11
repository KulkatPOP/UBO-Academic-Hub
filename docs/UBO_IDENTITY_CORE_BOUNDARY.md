# Frontera de identidad UBO → UniEcosystemCore

## Propósito y alcance

Este documento define una preparación reversible para que UBO Academic Hub entregue una identidad mínima al contrato genérico de UniEcosystemCore. No conecta el adapter a login, UI, router, guards, autorización ni persistencia; tampoco reemplaza `uboSession` ni `uboDemoIdentityV1`.

La dirección permitida es:

```text
UBO identity source → UBO Identity Adapter → IdentitySnapshot de UniEcosystemCore
```

El Core no importa ni conoce `uboSession`, `localStorage`, `sessionStorage`, usuarios UBO, roles UBO, credenciales, DOM, router, datos académicos o servicios de UBO.

## Estado actual

| Perfil | Mecanismo vigente | Estado |
|---|---|---|
| Student | `uboSession` legacy | Se conserva como sesión y login vigente. |
| Teacher | identidad demo `{ id, role }` en `uboDemoIdentityV1` | Se conserva para guards de shells demo. |
| Admin | identidad demo `{ id, role }` en `uboDemoIdentityV1` | Se conserva para guards de shells demo. |
| Core | `IdentitySnapshot`, `IdentityPort`, `SessionPort` | Sigue independiente y sin integración productiva. |

`uboSession` y demo identity no son equivalentes automáticamente. La primera contiene estado legacy de estudiante; la segunda guarda exclusivamente una pareja demo normalizada. Ningún mecanismo se modifica en esta fase.

## Contrato revisado del Core

El checkout de Core en `414eee6392afa54e93adcc4f6c42d3be08d4387a` define:

- `createIdentitySnapshot({ id, roles })`: valida `id` textual no vacío y `roles` como arreglo de textos no vacíos; devuelve un objeto inmutable.
- `IdentityPort`: expone `resolveIdentity()`, que puede devolver un snapshot válido o `null`.
- `SessionPort`: describe `getCurrentIdentity()`, `setCurrentIdentity(identity)` y `clear()`; no obliga a usar almacenamiento ni autenticación.

El adapter UBO es compatible porque produce exactamente `{ id, roles }` y usa `null` únicamente para ausencia de identidad. Una identidad presente pero malformada o con una pareja `id`/rol imposible genera un rechazo explícito.

## Mapping explícito

Los IDs no se inventan ni se cambian. Proceden de `data/users.js`; para Student legacy, la resolución existente deriva la pareja mediante el correo ya contenido en la sesión.

| Perfil UBO | ID demo existente | Claim Core `roles` |
|---|---|---|
| Sofía Martínez Rojas | `student-sofia-martinez` | `["STUDENT"]` |
| Carlos Pérez | `teacher-carlos-perez` | `["TEACHER"]` |
| Administrador UBO | `admin-ubo` | `["ADMIN"]` |

Los claims son explícitos y conservan los roles demo UBO actuales. No representan un estándar universal, no convierten permisos en roles y no agregan roles sintéticos.

## Profile → IdentitySnapshot

El adapter `services/adapters/core-identity-adapter.js` acepta una identidad UBO ya resuelta y normalizada. Su salida contiene únicamente:

```js
{ id, roles }
```

No propaga nombre, correo, contraseña, permisos, carrera, cursos, notas, asistencia, campus ni otros datos personales. La identidad legacy Student se puede adaptar en modo read-only cuando su objeto de sesión es entregado como argumento; el adapter no lee almacenamiento por sí mismo.

## Identidad, sesión, autenticación y autorización

| Responsabilidad | Definición | Situación actual |
|---|---|---|
| Identity | Quién es el sujeto mínimo: `id` y `roles`. | Adapter experimental no conectado. |
| Session | Qué identidad está activa temporalmente. | `uboSession` / demo identity siguen siendo mecanismos UBO separados. |
| Authentication | Cómo se verifica un usuario. | Login DEMO legacy; no se implementa autenticación real. |
| Authorization | Qué puede ejecutar una identidad. | Guards legacy/demo; no se conecta `AuthorizationContext` ni Permission Policy del Core. |

Un futuro `SessionPort` podrá recibir snapshots derivados sin reemplazar la sesión UBO hasta que exista una migración aprobada, con coexistencia, rollback y pruebas A/B.

## Ausencia, invalidación, cambios y logout

- **Ausencia:** una identidad no autenticada se representa como `null`, nunca `undefined`, `{}` ni una identidad anterior.
- **Invalidación:** ID vacío/inexistente, rol vacío/inexistente o pareja ID/rol imposible se rechazan; no se construye un snapshot.
- **Cambio de perfil:** Sofía → Carlos → Administrador → Sofía produce cuatro snapshots independientes de un único rol; no se retienen ni acumulan roles.
- **No privilege escalation:** propiedades adicionales como `permissions`, `isAdmin` o `roleClaims` no forman parte del output ni modifican el claim derivado del par normalizado.
- **Logout:** el flujo UBO actual continúa limpiando demo identity y `uboSession` según corresponda. La integración futura podrá limpiar un `SessionPort` después de esas operaciones, pero esta fase no lo conecta.

## Adapter y aislamiento

`adaptUboIdentityToCoreSnapshot(candidate)` convierte una identidad demo ya resuelta. `adaptLegacyStudentSessionToCoreSnapshot(legacySession)` reutiliza la resolución read-only existente de Student. `createUboIdentityPort(resolver)` permite ensayar el contrato de `IdentityPort` con un resolver inyectado solamente en pruebas.

El adapter no autentica, persiste, consulta red, gestiona tokens, autoriza, cambia datos ni accede a DOM. La dependencia física local hacia `UniEcosystemCore` sigue el patrón ya usado por los adapters Career y Room: UBO importa el contrato del Core; el Core no importa UBO. Es experimental hasta que el Core publique una superficie de exports estable.

## Privacidad

Los snapshots contienen solo IDs demo ya existentes y roles. Los tests no requieren credenciales, datos académicos ni información personal adicional. No se crea almacenamiento, backend, API, cookie, JWT, token, `localStorage` ni `IndexedDB`.

## Rollback y plan futuro

El rollback consiste en dejar de invocar el adapter experimental y eliminar sus archivos de prueba/documentación en una fase aprobada; no requiere recuperar datos ni revertir UI. Para una integración posterior:

1. mantener una adaptación de solo lectura y medir equivalencia de identidades;
2. conectar un `SessionPort` efímero detrás de una bandera, conservando las sesiones UBO;
3. definir una política explícita para traducir autorización legacy sin fusionar permisos con roles;
4. habilitar gradualmente rutas o módulos con rollback verificable;
5. sustituir mecanismos temporales solo después de autenticación y autorización institucional reales.

## Límites de esta fase

- `USE_CANONICAL_CAREER` permanece `false`.
- `USE_CANONICAL_ROOM` permanece `false`.
- PWA conserva `ubo-academic-hub-v114`.
- No se modifican `app.js`, UI, login, guards, dashboards ni datos DEMO.
- UniEcosystemCore no se modifica.
