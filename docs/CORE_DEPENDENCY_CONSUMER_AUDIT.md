# Auditoría de consumo de UniEcosystemCore por UBO

## A. Consumo actual

UBO consume el Core mediante imports físicos relativos, exclusivamente desde sus adapters institucionales y pruebas:

- `services/adapters/core-career-repository-adapter.js` importa `CareerModel`.
- `services/adapters/core-room-repository-adapter.js` importa `RoomModel`.
- Sus pruebas importan `RepositoryPort`.

No existe `package.json` en UBO, dependencia npm, workspace, symlink, submodule ni copia del Core.

## B. Dependencias y rutas

```text
UBO/services/adapters/core-career-repository-adapter.js
  -> ../../../UniEcosystemCore/data/models/career-model.js

UBO/services/adapters/core-room-repository-adapter.js
  -> ../../../UniEcosystemCore/data/models/room-model.js
```

La dirección es permitida: UBO conoce Core; Core no conoce UBO.

## C. Riesgos

- La ruta física depende de una ubicación específica de dos checkouts locales.
- El Core no tiene `exports`, por lo que el consumidor alcanza archivos internos.
- El Core es privado y su API permanece en evolución.
- El lockfile no existe porque UBO aún no tiene manifiesto de paquete.

## D. Estrategia recomendada

Tras estabilizar subpath exports del Core, UBO debería consumir una dependencia Git privada fijada a SHA para builds reproducibles. `file:../UniEcosystemCore` puede emplearse solo como override de desarrollo local, no como garantía única de entrega reproducible.

## E. Rollback y versionado

El manifiesto futuro fijará un SHA del Core y un lockfile. El rollback sustituye ese SHA por el checkpoint anterior aprobado y ejecuta tests de adapters/bridge; no altera datos, usuarios, credenciales ni flags.

## F. Próxima fase

Definir primero la API pública mínima del Core y validar un contrato de instalación en un entorno controlado. No modificar `private:true`, no publicar npm y no migrar otros dominios académicos hasta completar esa validación.
