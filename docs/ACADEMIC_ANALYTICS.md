# Analítica académica demo

## Objetivo

La Fase 1.90 ofrece indicadores de lectura para Profesor y Student sin modificar información institucional, registros ni flujos de gestión.

## Fuentes

La capa usa exclusivamente cursos asignados o inscritos y los servicios existentes de notas, asistencia, material y avisos demo. No crea almacenamiento, modelos ni fuentes adicionales.

## Cálculos

- Promedio demo: promedio de notas demo válidas entre 1,0 y 7,0.
- Distribución: buen desempeño (>= 6,0), seguimiento (4,0–5,9) y riesgo (< 4,0).
- Asistencia demo: `(PRESENT + JUSTIFIED) / registros`.
- Tendencia Student: compara las dos últimas notas cronológicas; diferencias mayores a 0,2 indican mejora o descenso.

## Aislamiento y seguridad

Profesor recibe solo cursos cuyo `professorId` coincide con su identidad. Student recibe solo cursos que contienen su `studentId`. Los renderizadores nuevos crean nodos DOM y asignan texto mediante `textContent`.

## Degradación y límites

Si una fuente falla, el servicio conserva el resto de los indicadores y devuelve advertencias. Los resultados son demo, no oficiales, no predictivos y no sustituyen promedios ni asistencia institucionales.

## Pruebas

`tests/academic-analytics.test.js` valida cálculos, tendencias, aislamiento, datos vacíos, datos corruptos, degradación parcial, copias defensivas y ausencia de capacidades de escritura.
