# Preferencias de usuario LMS

Las preferencias almacenadas en esta capa pertenecen al LMS Academic Hub y no representan información académica oficial de la Universidad.

## Alcance

La identidad se sigue resolviendo exclusivamente desde `users_reference.id` mediante `x-user-id`. La tabla `user_preferences` es complementaria: no duplica usuarios, roles, identificadores externos ni credenciales.

La auditoría previa encontró una sola preferencia visual configurable en la interfaz: el tema. Los estados locales de lectura de notificaciones no son una preferencia de envío, y no existen preferencias de tutor, aprendizaje, idioma o accesibilidad implementadas para migrar. Por ello no se crearon valores DEMO ni sincronizaciones masivas.

## Persistencia

La migración `010_user_preferences.sql` crea una fila opcional por usuario LMS con `UNIQUE(user_reference)`. Sus columnas permiten que futuras preferencias explícitas se almacenen de manera tipada, pero permanecen `null` hasta que un usuario las guarde.

Campos aceptados por la API:

- `theme`: `light`, `dark` o `system`.
- `language`, notificaciones y objetos de preferencias futuras, cuando el cliente los envíe con tipos válidos.

Campos como `role`, `external_id`, `password`, referencias de usuario y datos académicos están protegidos. `userId` enviado en el cuerpo se ignora: la identidad siempre procede del header y se resuelve en PostgreSQL.

## API y fallback

- `GET /api/user/preferences`
- `PATCH /api/user/preferences`

Ambos endpoints devuelven `source: "LMS"` y únicamente preferencias del usuario autenticado. No devuelven contraseñas, tokens ni secretos.

`services/api/user-preferences-api-service.js` usa `uboAcademicSession.userId` para enviar `x-user-id` y no transmite contraseñas. `theme-preference-service.js` conserva la preferencia local como fallback: intenta hidratar desde la API después de una sesión backend y sincroniza el cambio de tema de forma no bloqueante. Sin API o sin sesión, la interfaz mantiene el comportamiento local existente.

## Límites

No hay JWT, OAuth, SSO, backend de correo ni preferencias académicas oficiales. No se migraron datos de `localStorage` de forma automática y no se modificaron notas, asistencia, matrícula ni UniEcosystemCore.
