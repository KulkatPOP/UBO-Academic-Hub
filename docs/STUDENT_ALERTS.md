# Alertas académicas inteligentes — Student

## Objetivo

Presentar recomendaciones demo orientativas para Sofía Martínez Rojas sin modificar registros académicos ni sustituir información institucional.

## Fuentes de lectura

- `student-grade-service.js` para notas demo gestionadas por Profesor.
- `student-attendance-service.js` para asistencia demo gestionada por Profesor.
- `student-material-service.js` para materiales demo.
- `student-announcement-service.js` para avisos demo.

Las consultas se realizan para `student-sofia-martinez` y se validan contra los cursos inscritos del estudiante. No se muestran registros de otros estudiantes ni cursos externos.

## Reglas

| Tipo | Condición | Severidad |
| --- | --- | --- |
| `ATTENDANCE_WARNING` | Asistencia demo menor a 75% | `HIGH` |
| `GRADE_WARNING` | Última nota demo menor a 4,0 | `MEDIUM` |
| `GOOD_PERFORMANCE` | Última nota demo igual o superior a 6,0 | `INFO` |
| `NEW_MATERIAL` | Existe material demo reciente | `INFO` |
| `NEW_ANNOUNCEMENT` | Existe aviso demo reciente | `INFO` |

El servicio ordena por severidad (`HIGH`, `MEDIUM`, `INFO`) y luego por fecha descendente. La interfaz muestra un máximo de cinco alertas.

## UX y seguridad

- La sección aparece después del resumen académico y se identifica como recomendación basada en actividad demo.
- Cuando no hay alertas, muestra “Todo se encuentra en orden.”
- La UI crea nodos mediante `document.createElement` y asigna contenido con `textContent`; no usa `innerHTML` para datos del servicio.
- El servicio es determinista, solo lectura y no mantiene un `localStorage` propio.

## Degradación parcial

Cada fuente se consulta de forma independiente. Si una falla o entrega una advertencia, las alertas de las demás fuentes siguen disponibles y la interfaz muestra una nota no técnica.

## Limitaciones y evolución

Las alertas no son decisiones institucionales, no sustituyen notas ni asistencia oficiales y no generan notificaciones persistentes. Una futura etapa podrá incorporar reglas institucionales aprobadas y preferencias de notificación sin cambiar este contrato de lectura.

## Pruebas

`tests/student-alert.test.js` valida generación, estudiante/curso inválidos, severidades, orden, máximo, vacío, degradación, copias defensivas, aislamiento y uso de `textContent` en el renderizador.
