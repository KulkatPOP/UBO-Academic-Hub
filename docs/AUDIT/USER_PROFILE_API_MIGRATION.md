# Migración de perfil de usuario hacia API

## Objetivo

La aplicación conserva sus perfiles DEMO locales como fallback de presentación, pero puede hidratar la identidad pública desde el backend de UBO Academic Hub. Esta etapa no reemplaza la identidad institucional de UBO ni activa JWT, OAuth, SSO o migraciones académicas.

## Arquitectura anterior

El login DEMO resolvía el usuario en frontend y los perfiles Student, Teacher y Admin se presentaban desde datos locales e `uboInstitutionalSession`.

## Arquitectura incorporada

```text
Perfil de interfaz
  -> services/api/user-api-service.js
  -> GET /api/users/me (x-user-id DEMO)
  -> backend/src/services/user-service.js
  -> users_reference (PostgreSQL)
```

También está disponible `GET /api/users/:id` para consultas públicas controladas. Ambos contratos devuelven sólo `id`, `name` y `role`.

## Sesión y fallback

`uboAcademicSession` ahora guarda `id`, `userId`, `name`, `role` y `source: "backend"`; nunca almacena contraseña. Si la API no responde, la interfaz conserva el perfil DEMO actual sin sobrescribirlo. Errores válidos del backend, como un usuario inexistente, se devuelven de forma controlada.

El encabezado `x-user-id` es únicamente un mecanismo temporal de contexto DEMO. No constituye autenticación ni autorización de producción; JWT o identidad institucional federada serán necesarios antes de exponer el backend.

## Seguridad

- `password_demo` no se selecciona ni devuelve desde el servicio de perfil.
- La UI usa los flujos de renderizado seguro existentes.
- Los datos académicos, cursos y materiales no se migraron ni se consultan en esta fase.

## Próxima integración institucional

Cuando exista un proveedor de identidad, el contexto se obtendrá desde su token o sesión verificada y se reemplazará el encabezado DEMO, conservando el contrato público de perfil.
