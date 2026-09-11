# Fase 1.87 — Pulido visual y UX

## Objetivo

Elevar la presentación de UBO Academic Hub sin cambiar su lógica académica, datos, rutas, autenticación, sesión ni la separación entre UBO y UniEcosystemCore.

## Pantallas revisadas

- Student: Inicio, resumen académico, actividad reciente, cursos y sus datos publicados.
- Teacher: dashboard docente y detalle de curso (asistencia, notas, material y avisos).
- Admin: dashboard institucional, métricas, gestión académica y actividad operacional.

## Mejoras visuales aplicadas

- Se reforzó la jerarquía entre secciones, títulos, descripciones y valores principales.
- Las tarjetas de actividad académica ahora tienen espaciado, borde y elevación consistentes.
- El resumen académico distingue visualmente información institucional y actividad demo sin mezclar sus fuentes.
- Los estados vacíos existentes se presentan como contenedores claros, legibles y sin exposición de valores técnicos.
- Las tarjetas de profesor y administrador mantienen una densidad uniforme y elevación sutil al interactuar en dispositivos con puntero.
- Formularios y mensajes de éxito/error del detalle docente tienen agrupación visual y foco más evidente.
- Se incorporaron estilos de foco visible y una preferencia de movimiento reducido en las tres superficies.

## Navegación y acciones

No se modificaron destinos, rutas ni listeners. Se conservan los retornos existentes de Student, Profesor y Admin, incluidos Selector Demo y cierre de sesión demo.

## Responsive

- Móvil: una columna para contenido de actividad, tarjetas con padding reducido y controles de al menos 44 px cuando son acciones principales.
- Tablet y escritorio: grillas de dos columnas para la actividad del estudiante y la composición existente de los paneles Teacher/Admin.
- Las reglas usan `minmax(0, 1fr)` y `min-width: 0` para evitar desbordes por contenido largo.

## Accesibilidad

- Todos los controles interactivos reciben un indicador `:focus-visible` perceptible.
- No se agregó interacción basada únicamente en iconos.
- Se respeta `prefers-reduced-motion`.
- Los cambios no alteran el uso existente de `textContent` ni la sanitización de datos.

## PWA

La fase incorpora CSS y documentación. Durante la revisión visual se detectó que un shell PWA anterior seguía entregando un `index.html` cacheado sin las secciones recientes del Inicio. Para que el cliente reciba el shell vigente se actualizó de forma controlada el cache a `ubo-academic-hub-v126` y se versionaron sus referencias a CSS y JavaScript. No se incorporaron recursos de Core ni se alteró la estrategia de precache.

## Validaciones previstas

- Sintaxis JavaScript de la aplicación y módulos relevantes.
- Suite de pruebas UBO y prueba de precache PWA.
- `git diff --check`.
- Verificación de flags de integración Core desactivados.
- Revisión de que UniEcosystemCore no reciba cambios.

## Limitaciones

Este pulido no reemplaza una prueba de accesibilidad asistida ni una prueba manual en dispositivos físicos. Tampoco convierte los datos demo en información institucional real.
