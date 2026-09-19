# Fase 2.54 — Corrección de superposición en Dashboard Student

## Causa raíz

Con `#home.active`, la barra superior se oculta, pero `.content` mantenía una altura que todavía reservaba ese encabezado. En 390×844 esto dejaba una franja inferior vacía antes de `.bottom-nav`; el botón del asistente se ubicaba en esa franja y el área visible del dashboard se reducía innecesariamente.

Además, el panel expandido `.ai-chat-widget` tenía una regla móvil con `bottom: 8px`, por lo que podía invadir visualmente la navegación inferior.

## Corrección aplicada

- Se centralizó la altura efectiva de la navegación en `--ubo-bottom-nav-height`, incluyendo `env(safe-area-inset-bottom)`.
- Cuando Inicio está activo, `.content` ocupa el espacio hasta un dock explícito para el asistente y la navegación, sin reservar la cabecera que está oculta.
- `.screen` conserva una reserva inferior calculada para que el último contenido pueda desplazarse por encima de la navegación y del asistente.
- El botón y el panel del asistente se posicionan con la misma variable; el botón usa un dock propio para no tapar tarjetas y el panel abierto termina encima de la navegación en móvil.
- Se establecieron niveles de apilamiento explícitos: navegación `10`, asistente `11` sin intersección geométrica.

## Compatibilidad de caché

- Hoja de estilos: `styles.css?v=131`.
- Service Worker: `ubo-academic-hub-v200`.

La verificación detectó que `styles.css?v=130` se había almacenado antes del ajuste final del dock. Se incrementaron ambas versiones para obligar a recuperar la hoja final.

## Validación

- 390×844: contenido y navegación sin solapamiento; scroll completo y sin overflow horizontal.
- 768×1024: contenido final visible antes del dock del asistente y sin overflow horizontal.
- 1920×1080: el dashboard mantiene el dock, navegación y asistente sin intersección.
- Tema claro y oscuro: la reserva de layout usa variables de geometría y no introduce superficies nuevas.
- Panel del asistente: se verifica por encima de la navegación en modo móvil.
- Suite frontend: 113 pruebas aprobadas.
- Suite backend: 51 pruebas aprobadas.

## Alcance

Solo se modificaron layout, estilos PWA asociados y expectativas de versión en pruebas. No se alteraron autenticación, sesiones, APIs, PostgreSQL, LMS, datos ni Core.
