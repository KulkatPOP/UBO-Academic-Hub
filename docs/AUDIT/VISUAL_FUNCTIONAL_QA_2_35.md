# QA visual y funcional — Fase 2.35

## PASS

- **Student / dashboard:** sesión visual activa de Sofía, saludo, perfil académico DEMO, navegación inferior y accesos rápidos visibles sin pantalla blanca.
- **Student / cursos:** el listado renderiza tarjetas y la navegación hacia el detalle de Bases de Datos funciona.
- **Consola:** sin errores ni warnings capturados durante Dashboard → Cursos → Detalle.
- **Accesibilidad básica:** botones observados tienen nombres accesibles (`Mis ramos`, `Ver detalle`, `Volver`) y el contenido es navegable mediante árbol de accesibilidad.

## FAIL

- **Course Detail LMS:** al abrir Bases de Datos, las secciones de asistencia, notas y material muestran “No tienes acceso…”. No apareció el bloque esperado `Datos del LMS Academic Hub`, ni progreso, inteligencia, recomendaciones o Tutor LMS. El recorrido visual no pudo validar datos LMS en la pantalla.
- **Causa observada:** durante la inspección no había backend API activo para hidratar el detalle LMS; la interfaz conservó contenido legacy/DEMO. No se aplicó corrección automática porque la fase es QA y la causa debe resolverse en la configuración de ejecución o integración de backend.

## WARNING

- La lista visual Student contiene Bases de Datos, Programación IoT, Inglés Técnico y Ciberseguridad. La prueba no mostró Álgebra ni Programación LMS como tarjetas con origen LMS, por lo que no puede afirmarse que el listado visible corresponda a la colección LMS API.
- Las métricas visibles del dashboard indican datos DEMO/institucionales; no se mezclaron silenciosamente con una tarjeta LMS en el recorrido observado, pero la hidratación LMS no estuvo disponible.

## NOT_TESTED

- Login y logout visuales: la sesión de Sofía ya estaba activa; no se introdujeron credenciales en navegador.
- Recorrido visual Teacher y Admin: no se cambió la sesión actual para no destruir el estado de QA Student.
- Tutor contextualizado, recomendaciones reales, estados 401/403/404, fallback de red, persistencia tras recargar/reiniciar, responsive tablet/móvil y Service Worker visual.

## Correcciones

Ninguna. No se modificó código funcional durante esta QA.
