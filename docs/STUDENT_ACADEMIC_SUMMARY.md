# Resumen académico para Student

## Objetivo

El Home incorpora un resumen complementario para Sofía que separa datos institucionales existentes de actividad demo generada por Profesor.

## Información institucional y demo

La tarjeta institucional reutiliza los indicadores ya renderizados por Student: promedio, asistencia y ramos inscritos. No los recalcula ni los reemplaza.

La tarjeta `Actividad demo` se deriva de `uboDemoTeacherGrades`, `uboDemoTeacherAttendance`, `uboDemoTeacherMaterials` y `uboDemoTeacherAnnouncements` mediante los servicios Student existentes. No crea almacenamiento adicional.

## Servicio y aislamiento

`student-academic-summary-service.js` combina resultados read-only de notas, asistencia, material y avisos. Solo resume cursos institucionales de `student-sofia-martinez`; las notas y asistencias exigen además su `studentId` correcto. Las colecciones devueltas son copias defensivas.

Por cada curso se muestran, cuando existen, última nota demo, asistencia demo ya calculada, cantidad de materiales y avisos. La ausencia de datos se presenta con mensajes claros, nunca como porcentaje o dato institucional artificial.

## Resiliencia y seguridad

Un origen demo corrupto agrega una advertencia controlada sin impedir que las demás fuentes se presenten. La interfaz usa `textContent` para todo texto demo, evitando ejecución de HTML o JavaScript introducido desde Profesor.

## UX, PWA y pruebas

El resumen usa tarjetas responsivas y rotula explícitamente cada fuente. El service worker `v125` precachea el servicio. `tests/student-academic-summary.test.js` cubre integración Profesor → Student, aislamiento, persistencia derivada, copias defensivas, determinismo, XSS y degradación parcial.

## Limitaciones, rollback y evolución

No calcula promedio institucional, no agrega escrituras Student ni integra backend/Core. Para rollback se retiran el servicio, la sección y su precache; las fuentes de Profesor, sesión, guards, Admin y Core permanecen sin cambios. La evolución futura requerirá datos institucionales y autorización real.
