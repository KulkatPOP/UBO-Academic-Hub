# Validación del patrón de adapters institucionales

## Resultado

El patrón se confirma reutilizable para catálogos simples read-only:

```text
Institutional Source → Institutional Mapping → Repository Adapter → Canonical Model → RepositoryPort
```

| Característica | Career | Room |
|---|---|---|
| RepositoryPort | `list` y `getById` | `list` y `getById` |
| Read-only | Sí | Sí |
| Mapping explícito | ID, nombre, estado | ID, nombre, estado |
| Modelo Core | CareerModel | RoomModel |
| Copias defensivas | Snapshot y clones | Snapshot y clones |
| Determinismo | Sí | Sí |
| Pureza | Sin UI/storage/red | Sin UI/storage/red |
| Core depende de UBO | No | No |
| UI conectada | No | No |
| Bridge activo | No | No |

La repetición actual es deliberadamente pequeña: validación de array, match exacto de mapping, snapshot y copias. No se creó una factory o superclase porque Career y Room requieren campos, pérdidas y validaciones de mapping diferentes.

## Generalización futura

| Dominio | Evaluación | Motivo |
|---|---|---|
| Student | CAUTION | Identidad y relación con carrera requieren gobernanza institucional. |
| Teacher | CAUTION | Departamento y cursos asignados requieren fuente aprobada. |
| Course | BLOCKED | Section/Offering y relaciones académicas requieren decisión previa. |
| Enrollment | BLOCKED | Contrato y periodo institucional pendientes. |
| Evaluation | CAUTION | Requiere ciclo académico y estado aprobado. |
| Grade | BLOCKED | Depende de Evaluation, escala y reglas académicas. |
| Attendance | CAUTION | Requiere sesión/historial, no solo catálogo. |
| Material | CAUTION | Tipo, URL y propiedad requieren contrato de contenido. |

La próxima fase debe auditar el dominio elegido antes de crear otro adapter y no copiar estos archivos mecánicamente.
