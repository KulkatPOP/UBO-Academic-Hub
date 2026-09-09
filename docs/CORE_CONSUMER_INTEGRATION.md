# Integración UBO / UniEcosystemCore

Ubo Academic Hub es un consumidor institucional independiente. UniEcosystemCore aporta contratos y modelos genéricos; UBO mantiene su UI, datos DEMO, mappings, adapters, bridges, PWA y comportamiento legacy.

## Patrón validado: Career

```text
Fuente Career UBO
  -> mapping UBO
  -> Career Repository Adapter
  -> CareerModel / RepositoryPort del Core
  -> Career Migration Bridge
  -> UBO
```

El piloto Career fue probado temporalmente con el flag canónico activo y luego revirtió correctamente al camino legacy. El adapter es de solo lectura, toma snapshots defensivos y no usa DOM, storage, red, sesión ni autorización.

## Room

Room está preparado con el mismo patrón institucional, pero no se activa ni migra en esta fase. `USE_CANONICAL_ROOM` permanece en `false`.

## Flags y rollback

Los feature flags permiten validar un consumidor canónico sin eliminar el comportamiento legacy. El estado final actual es:

- `USE_CANONICAL_CAREER=false`
- `USE_CANONICAL_ROOM=false`

La activación requiere una prueba read-only controlada. El rollback consiste en devolver el flag a `false`, recargar y verificar la ruta legacy sin alterar datos.

## Dominios pendientes

Course, Enrollment, Grade, Attendance, Student, Teacher, Schedule, Evaluation y Material no se integran todavía porque sus contratos institucionales requieren definición adicional. Esta frontera tampoco conecta Career o Room con identidad, sesión o autorización institucional.
