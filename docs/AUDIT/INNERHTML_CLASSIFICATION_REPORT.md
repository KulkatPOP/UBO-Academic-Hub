# Clasificación final de `innerHTML` en `app.js`

Fecha de auditoría: 2026-09-10
Alcance: únicamente `app.js` (lectura funcional; no se migraron renderizadores).

## Resultado

- Asignaciones encontradas actualmente: **53**.
- Línea base indicada para esta fase: 37. La copia verificable del proyecto contiene 53; esta diferencia se registra, no se corrige artificialmente.
- Tipo A — riesgo real: **51**.
- Tipo B — HTML estático controlado: **1**.
- Tipo C — limpieza DOM: **0**.
- Tipo D — template controlado: **1**.

Tipo A incluye interpolación de datos de usuario, estado académico, colecciones, formularios, almacenamiento demo o parámetros de interfaz. Aunque algunas entradas procedan de datos demo locales, deben migrarse a creación de nodos antes de aceptar datos reales.

| Archivo | Función | Línea / uso | Tipo | Riesgo | Acción |
|---|---|---:|---|---|---|
| `app.js` | `notificationDetail` | 123 / #1 | A | Notificación, ramo y prioridad dinámicos | Migrar a DOM seguro |
| `app.js` | `renderInternationalization` | 144 / #1–#3 | A | Programas, países, fechas e IDs dinámicos | Migrar a DOM seguro |
| `app.js` | `internationalDetail` | 145 / #1 | A | Programa y estado dinámicos | Migrar a DOM seguro |
| `app.js` | `renderOpportunities` | 150 / #1–#3 | A | Filtros, oportunidades y guardados dinámicos | Migrar a DOM seguro |
| `app.js` | `opportunityDetail` | 151 / #1 | A | Datos de oportunidad y acciones dinámicas | Migrar a DOM seguro |
| `app.js` | `renderMarketplace` | 158 / #1–#2 | A | Publicaciones y filtros dinámicos | Migrar a DOM seguro |
| `app.js` | `marketplaceDetail` | 159 / #1 | A | Publicación, usuario y precio dinámicos | Migrar a DOM seguro |
| `app.js` | `renderTrajectory` | 164 / #1–#5 | A | Perfil, métricas, cursos, logros y objetivos dinámicos | Migrar a DOM seguro |
| `app.js` | `renderCommunity` | 168 / #1–#2 | A | Contenido y metadatos de publicaciones dinámicos | Migrar a DOM seguro |
| `app.js` | `communityDetail` | 169 / #1 | A | Texto de publicación y contador dinámicos | Migrar a DOM seguro |
| `app.js` | `renderAiAssistant` | 174 / #1 | A | Mensajes, incluido texto ingresado por usuario | Prioridad alta: migrar a DOM seguro |
| `app.js` | `renderAiWidget` | 176 / #1 | A | Mensajes, incluido texto ingresado por usuario | Prioridad alta: migrar a DOM seguro |
| `app.js` | `renderHomeEvents` | 178 / #1 | A | Eventos, fechas y atributos de navegación dinámicos | Migrar a DOM seguro |
| `app.js` | `renderHomeDeliveries` | 179 / #1 | A | Compromisos académicos y acciones dinámicas | Migrar a DOM seguro |
| `app.js` | `renderEvaluations` | 180 / #1 | A | Evaluaciones, estado y curso dinámicos | Migrar a DOM seguro |
| `app.js` | `evaluationDetail` | 181 / #1 | A | Datos académicos de evaluación dinámicos | Migrar a DOM seguro |
| `app.js` | `renderWeeklySchedule` | 183 / #1 | A | Horarios, salas y ramos dinámicos | Migrar a DOM seguro |
| `app.js` | `classDetail` | 184 / #1 | A | Clase, docente, sala y asistencia dinámicos | Migrar a DOM seguro |
| `app.js` | `classVirtual` | 185 / #1 | A | Curso, docente y entregas dinámicas | Migrar a DOM seguro |
| `app.js` | `documentPreview` | 203 / #1 | A | Documento y datos personales/académicos dinámicos | Prioridad alta: migrar a DOM seguro |
| `app.js` | `renderCampusEvents` | 205 / #1–#3 | A | Eventos, filtros, inscripciones y fechas dinámicos | Migrar a DOM seguro |
| `app.js` | `campusEventDetail` | 206 / #1 | A | Evento, ubicación y estado de inscripción dinámicos | Migrar a DOM seguro |
| `app.js` | `renderLibrary` | 212 / #1–#3 | A | Libros, préstamos, filtros y fechas dinámicos | Migrar a DOM seguro |
| `app.js` | `libraryBookDetail` | 213 / #1 | A | Metadatos de libro y acciones dinámicas | Migrar a DOM seguro |
| `app.js` | `renderCampusMap` | 218 / #1–#2 | A | Ubicaciones, edificios y filtros dinámicos | Migrar a DOM seguro |
| `app.js` | `campusLocationDetail` | 220 / #1 | A | Ubicación y eventos cercanos dinámicos | Migrar a DOM seguro |
| `app.js` | `renderHelpCenter` | 223 / #1–#2 | A | Artículos y búsqueda dinámica | Migrar a DOM seguro |
| `app.js` | `helpDetail` | 224 / #1 | A | Contenido y pasos de ayuda dinámicos | Migrar a DOM seguro |
| `app.js` | `renderVirtual` | 226 / #1 | A | Cursos, docentes y métricas dinámicos | Migrar a DOM seguro |
| `app.js` | `virtualDetail` | 227 / #1 | A | Curso y entregas dinámicas; conserva material controlado | Migrar a DOM seguro |
| `app.js` | `renderSummary` | 228 / #1 | A | Promedio calculado desde cursos | Migrar a DOM seguro |
| `app.js` | `renderGradeSimulator` | 236 / #1 | A | Ramo, notas, ponderaciones y proyección dinámicos | Prioridad alta: migrar a DOM seguro |
| `app.js` | `ensureSimulatorQuickAccess` | 240 / #1 | B | Fragmento literal, sin variables ni datos externos | Permitido temporalmente; documentado |
| `app.js` | `renderPersonal` | 242 / #1 | A | Datos personales y selección de carrera dinámicos | Prioridad alta: migrar a DOM seguro |
| `app.js` | `renderStudentCard` | 244 / #1 | A | Identidad, RUT, email y estado dinámicos | Prioridad alta: migrar a DOM seguro |
| `app.js` | `renderBenefits` | 245 / #1 | D | Array declarado localmente con contenido demo controlado | Evaluar migración por consistencia; no recibe datos externos |
| `app.js` | `calendarEventDetail` | 251 / #1 | A | Evento, curso, fechas y recordatorios dinámicos | Migrar a DOM seguro |

## Usos permitidos temporalmente

`ensureSimulatorQuickAccess()` contiene el único Tipo B: un fragmento literal para una acción fija del simulador, sin interpolación, datos de usuario ni fuente de servicio. Se mantiene temporalmente para evitar un cambio funcional innecesario durante una fase de auditoría.

`renderBenefits()` es Tipo D: genera un componente desde un arreglo literal definido dentro de la misma función. No es un canal de datos externos, pero deberá migrarse junto con los demás renderizadores para uniformidad y para que la clasificación no dependa de que los datos permanezcan estáticos.

## Prioridad recomendada

1. `renderAiAssistant()` y `renderAiWidget()` por procesar mensajes del usuario.
2. `renderPersonal()`, `renderStudentCard()` y `documentPreview()` por identidad y datos personales.
3. Simulador, oportunidades, comunidad y marketplace por datos editables/persistidos localmente.
4. El resto de listados y detalles académicos/institucionales, por bloques y conservando listeners, clases, IDs y `data-*`.

No se detectaron usos Tipo C (`innerHTML = ""`) en el inventario actual; las futuras limpiezas podrán preferir `replaceChildren()`.
