# Plan de migración gradual

## Contexto

UBO Academic Hub mantiene dos capas que aún no están conectadas:

- La aplicación estudiante actual, una PWA con navegación, sesión demo, datos académicos y módulos visibles concentrados principalmente en `app.js`.
- La arquitectura institucional futura, organizada en `core`, `data`, `services` y `modules`, preparada para Student, Teacher y Admin.

Ambas capas representan conceptos comunes —estudiante, curso, notas, asistencia y horario— pero usan distintos IDs, nombres de campos y niveles de detalle. La coexistencia es intencional para proteger el funcionamiento de la aplicación actual.

## Riesgos de una migración directa

- Los IDs actuales de ramo, como `db` e `iot`, no coinciden con los institucionales semestrales.
- Las notas actuales suelen representar promedios; no siempre contienen una evaluación, ponderación ni identificador oficial.
- La asistencia actual es un porcentaje acumulado, no un historial por clase y fecha.
- El modelo futuro de curso debe resolver la relación entre un curso y múltiples bloques de horario.
- El login y `uboSession` actuales no deben ser reemplazados hasta que exista una sesión institucional compatible.

## Fase 1: Diagnóstico

Objetivo: identificar compatibilidad sin escribir ni modificar datos.

- Ejecutar `checkStudentCompatibility()` sobre copias de los datos actuales.
- Usar los mapas de estudiantes, carreras, cursos y salas como referencia.
- Identificar IDs ausentes, equivalencias planificadas, notas agregadas y asistencia no migrable.
- Mantener los resultados únicamente como diagnóstico.

Resultado esperado: inventario de diferencias y prioridades de modelado por usuario.

## Fase 2: Solo lectura

Objetivo: representar datos actuales en los modelos futuros sin sustituir la PWA.

- Usar `student-app-adapter` y los adaptadores de curso, nota y asistencia.
- Generar `StudentModel`, `CourseModel`, `GradeModel` y `AttendanceModel` desde objetos copiados.
- Mostrar resultados solo en módulos demo aislados.
- No cambiar `app.js`, `uboSession`, localStorage ni los renderizadores actuales.

Resultado esperado: vistas de validación que demuestren qué información puede leerse de forma segura.

## Fase 3: Sincronización en sombra

Objetivo: crear una copia institucional controlada sin que la interfaz estudiante la consuma.

- Definir una fuente de identidad oficial y tablas de equivalencias aprobadas.
- Sincronizar en una sola dirección: aplicación actual hacia almacenamiento futuro.
- Versionar el esquema, registrar fecha de sincronización y aislar información por usuario.
- Comparar conteos, IDs, cursos y valores críticos antes de aceptar una sincronización.
- Mantener fallback completo a los datos antiguos.

Resultado esperado: datos futuros consistentes y auditables sin impacto visible para estudiantes.

## Fase 4: Migración progresiva

Objetivo: reemplazar fuentes de datos de manera incremental y reversible.

Orden recomendado:

1. Perfil y carrera del estudiante.
2. Cursos y matrícula.
3. Horarios y salas.
4. Evaluaciones y promedio visible.
5. Asistencia y sus registros por clase.
6. Materiales, aula virtual y comunicación.

Cada entrega debe incluir una bandera de activación, pruebas de navegación, fallback a la fuente anterior y validación de sesión. Nunca deben migrarse varios dominios críticos en el mismo cambio.
