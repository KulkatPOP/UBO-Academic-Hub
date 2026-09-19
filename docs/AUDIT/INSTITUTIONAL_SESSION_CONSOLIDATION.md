# Consolidación de sesión institucional LMS — Fase 2.30

## Alcance

Esta fase consolida el contexto de sesión del frontend en `uboAcademicSession`. Es una mejora de la capa LMS propia de UBO Academic Hub: no reemplaza el sistema institucional UBO ni activa el Core externo.

> La sesión consolidada identifica al usuario dentro del Academic Hub LMS; no constituye autenticación institucional UBO, SSO ni identidad académica oficial hasta integrar un proveedor institucional.

## Contrato canónico de sesión

El único registro persistente de contexto de usuario es `uboAcademicSession`:

```json
{
  "id": "uuid-del-backend-o-id-demo",
  "userId": "uuid-del-backend-o-id-demo",
  "name": "Nombre público",
  "role": "STUDENT | TEACHER | ADMIN",
  "source": "backend | demo"
}
```

No contiene contraseña, `password_demo`, token, perfil académico completo ni permisos adicionales. `services/api/auth-api-service.js` valida y normaliza esta forma; los clientes API utilizan sólo sesiones con `source: "backend"`.

## Origen y restauración

- El login intenta `POST /api/auth/login` primero.
- Si el backend responde correctamente, se guarda una sesión `source: "backend"` con el `id` que devolvió la API.
- Sólo un fallo de red o API activa el fallback DEMO. Un 401/403 o credenciales inválidas no cambian el origen a DEMO.
- Al recargar, `hydrateCurrentSession()` consulta `GET /api/users/me` mediante `x-user-id`, actualiza únicamente nombre/rol públicos y conserva `userId`.
- Un usuario inexistente confirmado por backend limpia la sesión. Errores de autorización o indisponibilidad preservan la sesión para no provocar cambios de identidad engañosos.

## Compatibilidad controlada

`services/institutional-session-service.js` quedó como fachada de compatibilidad para las vistas existentes. Ya no crea una segunda sesión: lee/escribe la clave canónica. La antigua clave `uboInstitutionalSessionV1` sólo se migra una vez si existe y se elimina inmediatamente. La identidad de guardas DEMO en `sessionStorage` se mantiene como compatibilidad de rutas, no como fuente de autenticación ni de datos de perfil.

El selector DEMO no puede cambiar de rol cuando la sesión canónica tiene `source: "backend"`. Para iniciar un perfil DEMO debe cerrarse primero la sesión activa.

## Clientes y perfiles

Todos los clientes API existentes obtienen `x-user-id` con `getAcademicSession()`. Student, Teacher y Admin pueden hidratar el nombre público al cargar sin exponer o persistir credenciales. Si la API no está disponible, las vistas conservan el fallback DEMO local actual.

## Cierre de sesión

`clearAcademicSession()` elimina únicamente `uboAcademicSession`. Los cierres existentes además limpian estado temporal de UI/guardas, sin borrar datos LMS, notas oficiales, asistencia oficial, matrícula ni datos DEMO de cursos.

## Pruebas realizadas

- Sesiones backend y DEMO normalizadas, sin contraseña.
- Restauración tras recarga y actualización del nombre público.
- Usuario inexistente, 401/403 y caída de API.
- Login y perfil público para STUDENT, TEACHER y ADMIN.
- Intento de falsificar rol en el cuerpo de login y en query de analítica.

## Limitaciones conocidas

- `x-user-id` es un mecanismo DEMO, no autenticación verificable.
- No hay JWT, OAuth, SAML, SSO ni proveedor institucional integrado.
- PostgreSQL y las sesiones locales no sustituyen sistemas oficiales UBO.
- La futura migración debe reemplazar el header DEMO por credenciales verificadas en servidor y autorización por claims.
