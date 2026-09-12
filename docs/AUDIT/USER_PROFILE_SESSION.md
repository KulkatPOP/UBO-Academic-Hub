# Perfil de usuario y sesión institucional demo

## Diseño

La sesión institucional demo se almacena en `localStorage` bajo la clave
`uboInstitutionalSessionV1`. Contiene únicamente información pública de la
identidad activa:

```js
{
  username: "msofia",
  nombre: "Sofía Martínez",
  name: "Sofía Martínez",
  role: "STUDENT",
  profile: "sofia",
  email: "sofia.martinez@ubo.cl"
}
```

No se almacenan contraseñas, permisos completos ni datos académicos en esta
sesión. La identidad demo existente y las guards de ruta se mantienen sin
cambios en Core.

## Perfiles visibles

- **Student:** nombre, usuario, rol, carrera y correo institucional demo en
  `Perfil`.
- **Teacher:** perfil institucional, correo y cursos asignados en el dashboard
  docente.
- **Admin:** perfil institucional y acceso al panel de gestión institucional
  en el dashboard administrativo.

Cada perfil se renderiza con nodos existentes o mediante `textContent`; no se
inyectan datos de usuario usando `innerHTML`.

## Cierre de sesión

`Cerrar sesión` elimina la identidad demo temporal, la sesión institucional y,
para Student, la sesión legacy `uboSession`. No elimina datos académicos demo,
materiales, notas ni asistencia almacenados por usuario.

## Limitaciones

Esta es una implementación de demostración local. No existe backend,
autenticación real, cifrado de sesión, recuperación de contraseña real ni
autorización de servidor. Las credenciales de ejemplo no deben reutilizarse en
un entorno productivo.
