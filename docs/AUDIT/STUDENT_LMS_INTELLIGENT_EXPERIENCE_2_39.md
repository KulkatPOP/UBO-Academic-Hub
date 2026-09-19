# Experiencia Student LMS inteligente — Fase 2.39

## Objetivo

Conectar visualmente las capacidades LMS existentes en una experiencia Student
coherente, conservando la separación explícita entre LMS y DEMO.

## Componentes y APIs reutilizados

- Progreso: `progress-api-service.js`.
- Inteligencia académica: `academic-intelligence-api-service.js`.
- Recomendaciones: `recommendation-api-service.js`.
- Detalle de curso: `course-detail-api-service.js`.
- Tutor contextual: `tutor-api-service.js`, disponible desde el detalle del
  curso autorizado.
- Sesión: `uboAcademicSession`, como fuente de `x-user-id`.

No se crearon endpoints, tablas, servicios paralelos ni métricas nuevas.

## Cambios de interfaz

- El Dashboard identifica que el progreso y las recomendaciones usan evidencia
  LMS cuando está disponible y que DEMO es un respaldo independiente.
- Las recomendaciones inteligentes reemplazan visualmente el plan DEMO sólo
  cuando la API LMS devuelve decisiones reales. Cada tarjeta expone su tipo,
  motivo, recurso recomendado y la etiqueta `LMS`.
- Si no hay recomendaciones LMS, se informa **Datos LMS insuficientes** sin
  sustituir ausencia de evidencia por `0`, `0%` o una conclusión positiva.
- Los fallos 401/403 muestran el estado de acceso y no convierten el contenido
  en DEMO. Los errores de red conservan el respaldo controlado ya existente.
- Course Detail mantiene su bloque único `Datos del LMS Academic Hub`, con
  progreso, asistencia, inteligencia, recomendaciones y Tutor contextual.

## Consistencia de datos

La UI consume la misma evidencia LMS por medio de los servicios existentes. En
la prueba de Bases de Datos se mantuvieron: asistencia `50%` (1 de 2), riesgo
`HIGH`, causa `LOW_ATTENDANCE_LMS`, tendencia `INSUFFICIENT_DATA`, `overall:
null` y el recurso recomendado **Clave primaria**. Estos valores no están
hardcodeados por la interfaz.

## Tema, accesibilidad y responsive

Las nuevas tarjetas reutilizan tokens, foco, contraste y `textContent` del
sistema existente; se añadieron estilos para tema oscuro. La disposición usa
grid/flex sin anchuras fijas y preserva el comportamiento responsive existente.
La prueba visual completa en tres breakpoints queda pendiente de una sesión de
QA dedicada (`RESPONSIVE_OK: NOT_TESTED`).

## PWA

Como cambian `app.js`, `styles.css` e `index.html`, el cache se actualizó a
`ubo-academic-hub-v183`, con `app.js?v=149` y `styles.css?v=122`. Las respuestas
privadas API no se agregan al precache.

## Validación prevista

- Sintaxis de JavaScript y suite frontend.
- Pruebas backend sin cambios de contrato.
- Navegación Sofía → Dashboard → Mis ramos → Bases de Datos.
- Tema claro y oscuro, consola y detalle LMS.

## Limitaciones

No se añade una ruta artificial al material recomendado: la interfaz lo
presenta como referencia LMS hasta que exista una ruta autorizada de recurso.
No se alteran datos oficiales, matrícula, notas, asistencia ni Core.
