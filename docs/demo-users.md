# Usuarios demo UBO Academic Hub

El selector de usuarios demo es una herramienta interna de desarrollo. Está aislado de la aplicación actual, no modifica el login existente y no habilita todavía ninguna pantalla nueva.

## Usuarios disponibles

| Usuario | Rol | Experiencia futura |
| --- | --- | --- |
| Sofía Martínez Rojas | `STUDENT` | Estudiante |
| Carlos Pérez | `TEACHER` | Profesor |
| Administrador UBO | `ADMIN` | Administrador |

## Objetivo

El módulo `modules/demo/demo-selector.js` permite seleccionar temporalmente un usuario demo utilizando la sesión futura en memoria. Posteriormente podrá utilizarse para enlazar de forma controlada los paneles `student-dashboard`, `teacher-dashboard` y `admin-dashboard`, sin reemplazar la autenticación actual hasta que se apruebe su integración.
