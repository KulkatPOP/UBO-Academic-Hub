# Fallback de API para frontend publicado

## Alcance

UBO Academic Hub continúa siendo un LMS LOCAL DEMO. No hay una API pública ni
una base de datos PostgreSQL expuesta para Netlify.

## Decisión de entorno

`services/api/api-environment.js` entrega `http://localhost:3001` solo cuando
el navegador se ejecuta en `localhost`, `127.0.0.1` o `::1`. En cualquier host
publicado devuelve `null`; los clientes API no realizan solicitudes al
localhost del visitante y conservan el fallback DEMO ya existente.

## Course Detail

El flujo Student resuelve primero la identidad LMS desde
`course-identity-api-service.js`. Sin API local configurada, la resolución no
se solicita y `course-detail-api-service.js` devuelve el estado controlado
`demo-fallback`. La interfaz conserva el detalle académico DEMO y comunica que
los datos LMS no están disponibles; no fabrica datos LMS ni institucionales.

## Service Worker

El Service Worker `ubo-academic-hub-v201` no intercepta solicitudes API ni
cross-origin. Solo administra documentos y assets del mismo origen. Los fallos
de red de assets se manejan mediante caché/fallback documental y no se
precachean respuestas privadas ni sesiones.

## Validación

- La prueba `api-environment.test.js` verifica que un host Netlify no solicita
  `localhost:3001` al resolver Course Detail.
- La suite PWA verifica el aislamiento de requests API/cross-origin.
- La prueba de backend local en esta ejecución quedó pendiente porque
  `localhost:3001` no estaba activo; no se infirió su resultado.
