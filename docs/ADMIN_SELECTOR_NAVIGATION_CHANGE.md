# Acceso al Selector Demo — Panel Administrativo

## Problema identificado

El Panel Administrativo solo permitía volver al Selector Demo mediante **Cerrar sesión demo**. Esa acción limpia la identidad `admin-ubo` / `ADMIN`, aunque el usuario puede necesitar únicamente volver a elegir una experiencia demo.

## Solución

Se agregó un enlace visible **Selector Demo** en el header administrativo, separado del botón de logout. Usa la ruta existente relativa `../demo/demo-selector.html`, equivalente a `/modules/demo/demo-selector.html`.

## Semántica

| Acción | Destino | Identidad demo |
| --- | --- | --- |
| Selector Demo | Selector Demo | Se conserva. |
| Cerrar sesión demo | Selector Demo | Se limpia mediante la lógica existente. |

No se modificaron `clearCurrentDemoIdentity()`, los guards, el router demo, usuarios, roles, IDs ni credenciales.

## Guards

El enlace no evita ni cambia el guard Admin. El dashboard sigue requiriendo `ADMIN`; Student, Teacher o una identidad ausente continúan siendo redirigidos por la lógica existente.

## PWA

Solo se modificaron HTML/CSS existentes del shell Admin; no se agregaron módulos ESM ni assets. `service-worker.js` y `ubo-academic-hub-v114` permanecen sin cambios.

## Archivos modificados

- `modules/admin/admin-dashboard.html`
- `modules/admin/admin-dashboard.css`

## Riesgo

El enlace es exclusivamente de navegación. Mantenerlo separado del logout evita confundir retorno con limpieza de identidad.
