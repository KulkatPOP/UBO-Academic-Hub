# Auditoría de hardening `innerHTML`

## Alcance

Auditoría estática de los JavaScript de UBO Academic Hub. UniEcosystemCore no fue revisado ni modificado dentro de esta tarea.

## Inventario

- Encontrados inicialmente: **130** usos de asignación a `innerHTML`.
- Corregidos en las iteraciones 1.92.1–1.92.22: **96** usos de renderizado dinámico.
- Pendientes: **34** usos legacy, concentrados en `app.js` (2) y las interfaces demo aisladas de Biblioteca, Eventos, Casino, Pagos, Emergencias y migración.

## Usos corregidos

| Archivo | Cantidad | Datos protegidos |
| --- | ---: | --- |
| `app.js` | 71 | onboarding, notificaciones de Inicio, lista de alertas/notificaciones, detalle de notificación, atención académica, agenda diaria, compromisos, correo institucional, bandeja y detalle de correo, calendario, eventos del calendario, solicitudes DAE, ramos, detalle de ramo, asistencia, simulación de asistencia, certificados, entregas, detalle de entrega, documentos, alertas académicas, chat IA, datos personales, credencial virtual, vista previa de documento, simulador de notas, Marketplace, Comunidad, Trayectoria Académica, Biblioteca, Campus, Eventos, Evaluaciones, Horario, Aula Virtual, Resumen académico, Centro de ayuda, Internacionalización y Oportunidades. |
| `modules/professor/teacher-dashboard.js` | 2 | resumen docente y acciones futuras. |
| `modules/professor/teacher-course-detail.js` | 17 | alumnos, asistencia, notas, materiales, avisos y mensajes de error. |
| `modules/admin/admin-dashboard.js` | 4 | métricas, gestión académica, analítica y operaciones administrativas. |
| `modules/demo/demo-selector-ui.js` | 1 | perfiles demo, nombre, correo, rol y acción de acceso. |

Los puntos corregidos construyen nodos con `document.createElement`, asignan los valores con `textContent` y usan `append`/`replaceChildren`. Ningún dato procedente de cursos, estudiantes, notas, asistencia, materiales, avisos ni métricas llega a `innerHTML` dentro de esos renderizadores.

## Fase 1.92.16 — Marketplace y Comunidad

Se eliminaron seis asignaciones dinámicas de `app.js`:

- `renderMarketplace()` (filtros y listado).
- `marketplaceDetail()`.
- `renderCommunity()` (filtros y listado).
- `communityDetail()`.

Los IDs de publicaciones y acciones se conservan mediante `dataset`; títulos, descripciones, usuarios, comentarios, precios y métricas se asignan con `textContent`. Los estados vacíos también se construyen como nodos, sin HTML interpolado.

## Fase 1.92.17 — Trayectoria Académica

Se eliminaron cinco asignaciones dinámicas de `renderTrajectory()`: resumen de estudiante, avance curricular, historial académico, logros y objetivos. Las tarjetas conservan sus clases e IDs; el estado de cada objetivo utiliza `dataset.goalToggle` y los valores académicos se asignan mediante nodos seguros.

## Fase 1.92.18 — Biblioteca, Campus y Eventos

Se eliminaron trece asignaciones dinámicas de listados, filtros y detalles de Biblioteca, Campus y Eventos: Inicio, eventos UBO, catálogo y detalle de libros, mapa y ubicación, y detalle de eventos del calendario. Las acciones de reserva, préstamo, inscripción, recordatorio, ubicación y navegación se preservan mediante `dataset`.

## Fase 1.92.20 — Evaluaciones, Horario, Aula Virtual y Resumen

Se eliminaron ocho asignaciones dinámicas de `app.js`: `renderEvaluations()`, `evaluationDetail()`, `renderWeeklySchedule()`, `classDetail()`, `classVirtual()`, `renderVirtual()`, `virtualDetail()` y `renderSummary()`. Evaluaciones, ramos, docentes, fechas, salas, asistencia, materiales, tareas, promedios y progreso se asignan con `textContent`. Los botones mantienen sus acciones mediante `dataset` (`evaluation`, `class`, `classVirtual`, `virtual`, recordatorios y navegación existente).

## Fase 1.92.21 — Notificaciones, compromisos y Centro de ayuda

Se eliminaron cinco asignaciones dinámicas de `app.js`: `notificationDetail()`, `renderHomeDeliveries()`, las dos listas de `renderHelpCenter()` y `helpDetail()`. Mensajes, títulos, prioridades, fechas, artículos y pasos de ayuda ahora se escriben con `textContent`. Las rutas de notificación, clase, evaluación, entrega, eventos y ayuda conservan su funcionamiento mediante `dataset`.

## Fase 1.92.22 — Internacionalización y Oportunidades

Se eliminaron las últimas ocho asignaciones Tipo A de `app.js`: las tres listas de `renderInternationalization()`, `internationalDetail()`, los tres bloques de `renderOpportunities()` y `opportunityDetail()`. Programas, países, universidades, fechas, requisitos, oportunidades, estados y textos de acción se renderizan con nodos y `textContent`; filtros, detalle, guardado y recordatorios se preservan mediante `dataset`.

## Usos permitidos

No se declaró ningún uso dinámico restante como permitido para datos reales. Un uso podría mantenerse en el futuro solamente cuando el valor sea HTML completamente estático, sin interpolaciones ni datos externos, y deberá documentarse junto a su consumidor.

## Riesgo pendiente

La aplicación legacy aún tiene renderizadores dinámicos con `innerHTML`. Muchos aplican `escapeHTML`, pero eso no satisface el contrato de esta fase para datos reales ni ofrece una política única de seguridad. La migración completa debe abordarse por lotes de pantalla, con pruebas visuales de regresión por cada lote; no debe hacerse mediante una sustitución textual global.

## Validación incluida

`tests/innerhtml-hardening.test.js` protege los tres renderizadores institucionales endurecidos, los bloques críticos de Inicio y los módulos críticos de chat, perfil, credencial, vista previa de documento y simulador de notas contra una regresión de `innerHTML`.

## Estado

- `INNERHTML_AUDIT_COMPLETE`: sí.
- `DYNAMIC_INNERHTML_REMOVED`: parcial; completado para Admin, Profesor y bloques críticos de Inicio enumerados arriba.
- `XSS_HARDENING_OK`: parcial; no puede declararse global hasta migrar los 103 usos legacy restantes.
