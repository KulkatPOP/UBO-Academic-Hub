# Clasificación de `innerHTML` restantes — Fase 1.92.15

Alcance: `app.js` únicamente. Esta fase no modifica renderizadores.

## Resultado verificable

- Total analizado: **23** asignaciones.
- Tipo A — riesgo real: **21**.
- Tipo B — HTML estático seguro: **1**.
- Tipo C — limpieza DOM: **0**.
- Tipo D — template controlado: **1**.

Las líneas son aproximadas: `app.js` conserva funciones compactas de una sola línea. Los rangos `#1–#N` corresponden a cada asignación independiente identificada dentro de esa función.

| Función | Línea | Tipo | Datos dinámicos | Riesgo | Acción |
|---|---:|---|---|---|---|
| `notificationDetail` | 123 / #1 | A | notificación, prioridad, ramo y acción | El detalle incorpora contenido académico y atributos de navegación | Migrar por bloques a DOM seguro |
| `renderInternationalization` | 144 / #1–#3 | A | programas, países, fechas e IDs | Listados institucionales y filtros interpolados | Migrar a DOM seguro |
| `internationalDetail` | 145 / #1 | A | programa, estado, requisitos y fechas | Detalle de postulación | Migrar a DOM seguro |
| `renderOpportunities` | 150 / #1–#3 | A | filtros, oportunidades, guardados y fechas | Datos locales persistibles y atributos dinámicos | Migrar a DOM seguro |
| `opportunityDetail` | 151 / #1 | A | organización, requisitos, carrera y estado | Detalle de oportunidad dinámico | Migrar a DOM seguro |
| `renderHomeDeliveries` | 179 / #1 | A | clases, evaluaciones, entregas y recordatorios | Compromisos académicos y acciones | Migrar a DOM seguro |
| `renderEvaluations` | 180 / #1 | A | ramo, evaluación, estado y fecha | Información académica | Migrar a DOM seguro |
| `evaluationDetail` | 181 / #1 | A | título, curso, docente, fecha y estado | Detalle académico | Migrar a DOM seguro |
| `renderWeeklySchedule` | 183 / #1 | A | días, clases, horario, sala y ramo | Horario académico | Migrar a DOM seguro |
| `classDetail` | 184 / #1 | A | curso, docente, sala y asistencia | Datos académicos | Migrar a DOM seguro |
| `classVirtual` | 185 / #1 | A | curso, docente y entregas | Datos académicos y tareas | Migrar a DOM seguro |
| `renderHelpCenter` | 223 / #1–#2 | A | artículos, categorías y consulta de búsqueda | Resultados y contenido dinámicos | Migrar a DOM seguro |
| `helpDetail` | 224 / #1 | A | artículo, resumen, contenido y pasos | Contenido editorial dinámico | Migrar a DOM seguro |
| `renderVirtual` | 226 / #1 | A | ramos, docentes y métricas | Datos académicos | Migrar a DOM seguro |
| `virtualDetail` | 227 / #1 | A | ramo, docente y entregas | Datos académicos | Migrar a DOM seguro |
| `renderSummary` | 228 / #1 | A | promedio calculado desde ramos | Métrica académica | Migrar a DOM seguro |
| `ensureSimulatorQuickAccess` | 240 / #1 | B | Ninguno; literal fijo | No hay interpolación ni datos externos | Permitido y cubierto por test |
| `renderBenefits` | 245 / #1 | D | Arreglo literal interno de beneficios demo | No consume usuario, servicio ni almacenamiento; migrar por consistencia | Evaluar en fase posterior |

## Riesgos principales

1. **Contenido editable o persistible**: oportunidades.
2. **Datos académicos**: trayectoria, evaluaciones, horario, aulas y resumen.
3. **Servicios institucionales**: internacionalización y ayuda.
4. **Atributos de acciones**: los `data-*` que hoy se interpolan deben conservarse mediante `dataset` durante la migración.

## Usos permitidos

El único Tipo B es `ensureSimulatorQuickAccess()`: la asignación contiene solo la etiqueta, texto e icono fijos del acceso al simulador. No tiene interpolaciones ni recibe datos externos.

No se encontraron asignaciones Tipo C (`innerHTML = ""`).

## Próxima fase recomendada

Marketplace y Comunidad se migraron en la Fase 1.92.16; Trayectoria Académica en la Fase 1.92.17; Biblioteca, Campus y Eventos en la Fase 1.92.18. El siguiente lote recomendado es Oportunidades e Internacionalización, junto con sus detalles asociados. Debe hacerse bloque por bloque, preservando clases, IDs, `data-*` y listeners existentes.
