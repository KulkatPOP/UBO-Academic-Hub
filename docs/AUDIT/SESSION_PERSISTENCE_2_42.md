# Sesiones persistentes — Fase 2.42

La pérdida anterior ocurría porque la sesión opaca residía sólo en `Map` de Express. La migración `012_persistent_sessions.sql` crea `auth_sessions`: id, hash SHA-256 del token, usuario, creación, expiración, revocación y último uso; no contiene contraseña ni token en texto plano.

El token se genera con `crypto.randomBytes(32)`, se entrega sólo en cookie `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` únicamente en producción. El backend busca el hash, exige no expiración/revocación y la cookie prevalece sobre headers o parámetros. Logout revoca exclusivamente la sesión actual y elimina la cookie. `last_seen_at` se actualiza como máximo cada cinco minutos.

CSRF: SameSite=Lax y CORS de orígenes locales explícitos con credenciales; no hay `*` con credenciales. Para producción se requiere añadir verificación Origin/CSRF para cualquier origen adicional.

Prueba HTTP real con PostgreSQL: login 200, cookie HttpOnly, cursos 200 antes y después de recrear Express, logout 204 y reutilización 401. No se expusieron valores de cookie, hashes ni contraseñas. La identidad sigue siendo DEMO, no SSO institucional.
