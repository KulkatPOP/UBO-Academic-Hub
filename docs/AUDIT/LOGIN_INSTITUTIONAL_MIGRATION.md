# Migración de login institucional simulado — Fase 1.99

## Cambio realizado

El acceso demo ahora valida credenciales institucionales simuladas en lugar de exigir la selección manual de un perfil. La aplicación principal y la pantalla `modules/demo/demo-selector.html` usan la misma fuente `data/users.js`.

## Usuarios demo

| Rol | Nombre | Usuario | Contraseña | Perfil |
| --- | --- | --- | --- | --- |
| STUDENT | Sofía Martínez Rojas | `msofia` | `123456` | `sofia` |
| TEACHER | Carlos Pérez | `pcarlos` | `123456` | `carlos` |
| ADMIN | Administrador UBO | `admin` | `admin123` | `admin` |

El formato de usuario es la primera letra del primer apellido seguida del primer nombre, en minúsculas y sin acentos. Para ADMIN el nombre de usuario reservado es `admin`.

## Compatibilidad

- Student conserva `uboSession`, sus datos demo y la aplicación principal.
- Teacher y Admin conservan sus rutas y guards existentes; el login solamente prepara su identidad demo antes de navegar.
- No se modificaron Core, servicios académicos, permisos ni modelos.

## Limitaciones

Este mecanismo es únicamente una simulación local. Las credenciales son públicas de demostración, no se envían a un backend y no deben reutilizarse como patrón de autenticación productiva.
