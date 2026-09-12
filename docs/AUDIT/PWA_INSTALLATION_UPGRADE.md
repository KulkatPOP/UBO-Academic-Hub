# Mejora de instalación PWA

## Manifest

El manifiesto identifica la aplicación como **Ubo Academic Hub**, con el nombre corto **UBO Hub**, descripción institucional, `start_url` relativo a la raíz, modo `standalone`, orientación vertical, idioma `es-CL` y colores de marca.

Los iconos locales existentes se validaron en 192×192 y 512×512 px. Ambos incluyen los propósitos `any` y `maskable`; no se requirieron placeholders.

## Instalación

La sección **Aplicación** dentro de Preferencias de visualización muestra el estado de instalación y expone el botón nativo **Instalar aplicación** solo cuando el navegador entrega `beforeinstallprompt`.

El prompt queda diferido, se dispara únicamente por acción explícita de la persona usuaria y se oculta después de usarlo. `appinstalled` actualiza el estado y comunica: “UBO Academic Hub instalada correctamente”. No se usan scripts externos ni `innerHTML` dinámico.

## Service Worker

La caché es `ubo-academic-hub-v160`; precachea `app.js?v=134`, la hoja de estilos actual y los recursos PWA necesarios. La activación elimina cachés anteriores. Las solicitudes de documento son network-first con `cache: 'no-store'`, evitando servir shells previos cuando existe red y dejando el shell precacheado solo como fallback offline.

## Limitaciones demo

- La aparición del prompt depende del navegador, origen seguro y criterios de instalación del sistema.
- Safari/iOS ofrece la instalación desde el menú del navegador y puede no exponer `beforeinstallprompt`.
- La validación offline automatizada cubre precache, grafo ESM y fallbacks declarados; la experiencia sin conexión debe confirmarse también en el navegador objetivo.
