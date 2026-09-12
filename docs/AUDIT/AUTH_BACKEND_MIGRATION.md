# Migración de autenticación demo hacia API

## Arquitectura anterior

El formulario Student verificaba `data/users.js` directamente y guardaba la sesión demo en almacenamiento local. No existía una capa API ni base PostgreSQL para el login.

## Arquitectura actual de transición

```text
Formulario PWA
  └── services/api/auth-api-service.js
        └── POST http://localhost:3001/api/auth/login
              └── users_reference (PostgreSQL demo)
```

Cuando la API responde, el frontend guarda `uboAcademicSession` con `id`, `name`, `role` y `source: "backend"`; nunca guarda contraseña. Para mantener rutas y vistas existentes, el perfil demo local se usa únicamente como puente temporal después de que la API valide rol/usuario. Si la API no responde, se conserva el fallback demo actual. Una respuesta `401` no activa fallback.

## Límites demo

- `password_demo` sólo existe en semilla y ambiente local.
- No hay JWT, cookies de sesión, OAuth, SAML ni SSO.
- No hay usuarios institucionales definitivos ni conexión al ERP UBO.
- Producción debe migrar a `password_hash` (o identidad federada), sesiones seguras httpOnly, límites de tasa, auditoría y autorización de servidor.
