# Preferencias visuales: tema claro y oscuro

## Alcance

La preferencia visual es una capa de interfaz local. No modifica Core, autenticación, permisos, servicios académicos ni datos demo.

## Persistencia

`services/theme-preference-service.js` guarda únicamente `uboThemePreference` en `localStorage`, con los valores `light` o `dark`. Al no existir un valor válido, usa `prefers-color-scheme`. El valor se aplica al elemento raíz mediante `data-theme`.

La preferencia no forma parte de la sesión institucional y no se borra al cerrar sesión; así se mantiene entre perfiles demo y recargas del navegador.

## Interfaces

- Student: control accesible en **Mi perfil** y opciones claro/oscuro en Preferencias de visualización.
- Teacher: control de tema en el encabezado del Panel Docente.
- Admin: control de tema en el encabezado del Panel Administrativo.

Todos los controles usan botones nativos, `aria-label`, `aria-pressed` y foco visible. Los textos se actualizan con `textContent`.

## Estilos

Los estilos incorporan variables para fondo, superficie, tarjetas, texto, texto secundario, bordes y acento. Cada shell mantiene sus variables institucionales y aplica sus overrides bajo `html[data-theme="dark"]`.

## Limitaciones demo

- No existe sincronización con backend ni entre dispositivos.
- La detección de la preferencia del sistema se usa solo si no hay elección guardada.
- El modo se limita a las interfaces disponibles en la demo; no altera contenido ni lógica académica.
