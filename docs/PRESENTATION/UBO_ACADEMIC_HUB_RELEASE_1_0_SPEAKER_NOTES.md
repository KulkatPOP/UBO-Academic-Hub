# Notas del expositor — UBO Academic Hub Release 1.0

Duración objetivo total: **12 minutos**. Mantener el lenguaje técnico solo cuando aporte claridad y no afirmar integración institucional existente.

| Slide | Objetivo | Qué mostrar | Qué decir | Duración |
| --- | --- | --- | --- | --- |
| 1 | Enmarcar la entrega. | Portada. | “Es una Release 1.0 local y DEMO, preparada documentalmente para una integración futura.” | 0:30 |
| 2 | Explicar necesidad. | Problema. | “Se busca ordenar flujos académicos distintos por rol sin asumir fuentes institucionales aún.” | 0:40 |
| 3 | Presentar alcance. | Capacidades. | “La propuesta reúne LMS, analítica explicable, recomendaciones y Tutor contextualizado.” | 0:40 |
| 4 | Diferenciar roles. | Tabla Student/Teacher/Admin. | “Cada rol ve solamente las funciones y datos que corresponden a su alcance.” | 0:40 |
| 5 | Situar componentes. | Diagrama de arquitectura. | “La PWA consume una API Express local; PostgreSQL conserva recursos propios del LMS.” | 0:50 |
| 6 | Explicar evidencia. | Flujo LMS. | “Los recursos derivados parten de evidencia LMS local; no equivalen a registros oficiales UBO.” | 0:40 |
| 7 | Aclarar inteligencia. | Reglas y `INSUFFICIENT_DATA`. | “No es Machine Learning ni predicción; es una clasificación transparente de solo lectura.” | 0:50 |
| 8 | Explicar recomendaciones. | Flujo y ejemplo. | “Una señal verificable puede conducir a un material autorizado; sin evidencia, no se recomienda.” | 0:45 |
| 9 | Explicar Tutor/RAG. | Diagrama Tutor. | “El Tutor usa el curso autorizado y conocimiento local; no llama modelos externos.” | 0:45 |
| 10 | Declarar seguridad. | Lista de controles. | “Es seguridad apropiada para demo local, no una declaración de producción institucional.” | 0:50 |
| 11 | Mostrar calidad visual. | Light/Dark/responsive. | “Las auditorías verificaron los tres roles en los tres tamaños documentados.” | 0:35 |
| 12 | Mostrar experiencia móvil. | Captura real pendiente en Dark Mode. | “La experiencia mantiene navegación y funciones principales en móvil y tablet; la captura se inserta solo cuando esté disponible y verificada.” | 0:25 |
| 13 | Preparar demo. | Pasos resumidos. | “El recorrido prioriza un curso y luego muestra la perspectiva docente y administrativa.” | 0:30 |
| 14 | Respaldar estado. | Tabla de pruebas. | “Las cifras corresponden a las suites ejecutadas: 113 frontend y 51 backend.” | 0:35 |
| 15 | Separar presente/futuro. | Dos columnas. | “La integración UBO no está implementada: se documentó lo requerido para realizarla.” | 0:45 |
| 16 | Mostrar preparación. | Lista de activos. | “Hay contratos, frontera y capas desacopladas; UBO debe aportar las fuentes y reglas oficiales.” | 0:40 |
| 17 | Ser transparente. | Limitaciones. | “Los límites son deliberados: datos demo, sin SSO ni sincronización institucional.” | 0:35 |
| 18 | Cerrar valor. | Componentes recibidos. | “La entrega es una base funcional, documentada y comprobada para continuar.” | 0:35 |
| 19 | Cierre. | Mensaje final. | Leer el mensaje de cierre y abrir preguntas. | 0:25 |

## Recomendaciones de conducción

- Usar los términos **DEMO**, **local** y **futura integración** al describir datos e identidad.
- Si se consulta por predicción o Machine Learning, remitir a la Slide 7: reglas deterministas y explicables.
- Si se consulta por integración, remitir a las Slides 14–15 y a los contratos 2.48/2.49.
- No mostrar ni mencionar valores de cookies, tokens ni secretos durante la demo.
