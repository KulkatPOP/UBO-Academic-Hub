# Analítica de riesgo académico DEMO

## Propósito

`services/analytics/academic-risk-service.js` genera indicadores explicables y de solo lectura para las vistas Student, Teacher y Admin. No usa IA externa, backend ni modifica calificaciones, asistencia, evaluaciones o almacenamiento.

## Reglas transparentes

- **HIGH**: asistencia menor a 75%, promedio demo menor a 4,0 o dos o más evaluaciones demo abiertas pendientes.
- **MEDIUM**: asistencia entre 75% y menos de 85%, promedio demo entre 4,0 y menos de 5,0, o información demo insuficiente.
- **LOW**: promedio demo igual o mayor a 5,0 y asistencia demo igual o mayor a 85%.

Las recomendaciones derivadas son: contacto con estudiante (HIGH), seguimiento preventivo (MEDIUM) y continuidad del rendimiento (LOW).

## Fuentes y limitaciones

La capa consulta servicios existentes de cursos, estudiantes, notas demo, asistencia demo y evaluaciones online demo. Los resultados son copias defensivas; el servicio no escribe registros. Los indicadores no son una predicción clínica, una calificación oficial ni una decisión académica. La ausencia de registros se comunica como información demo parcial y genera seguimiento preventivo, no datos inventados.

## Cobertura

- Student: estado agregado, motivos, métricas y tendencia demo.
- Teacher: distribución por curso y estudiantes que requieren seguimiento.
- Admin: conteos institucionales derivados, cursos críticos y distribución de niveles.

`tests/academic-risk.test.js` cubre niveles HIGH y LOW, asistencia baja, evaluaciones pendientes, cálculo agregado y ausencia de mutaciones de la fuente inyectada.
