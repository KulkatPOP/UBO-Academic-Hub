# Estado final del proyecto — UBO Academic Hub

## Nombre y objetivo

UBO Academic Hub es una PWA académica demostrativa orientada a centralizar la experiencia universitaria. Su objetivo es validar una experiencia integrada para los perfiles Student, Teacher y Admin sin conectarse aún a sistemas institucionales reales.

## Arquitectura actual

- **Aplicación Student:** `index.html`, `app.js` y `styles.css`; conserva los flujos existentes de la PWA.
- **Módulos por perfil:** interfaces aisladas en `modules/professor/` y `modules/admin/`, además de herramientas bajo `modules/demo/`.
- **Datos y servicios:** datos demo en `data/`, consultas y acciones en `services/`, y adaptadores de transición para la arquitectura institucional futura.
- **Core futuro:** `core/` mantiene contratos e infraestructura preparados sin sustituir la aplicación actual ni activar flags de Core.
- **PWA:** `manifest.json`, `service-worker.js` e iconos en `icons/` proporcionan instalación y offline básico.

## Tecnologías

- HTML5, CSS3 y JavaScript ES Modules.
- Service Worker, Web App Manifest y recursos estáticos.
- Datos demo en memoria y persistencia local temporal sólo donde la aplicación principal ya la utiliza.

## Roles

- **Student:** dashboard académico, ramos, notas, asistencia, material, avisos, alertas y herramientas de proyección.
- **Teacher:** resumen docente, detalle de curso, gestión demo de asistencia, notas, material y avisos.
- **Admin:** resumen institucional, gestión académica y analítica demo.

## Funcionalidades implementadas

- Notas, simulador de notas y visualización académica.
- Asistencia y calculadora de asistencia.
- Material académico y avisos de curso.
- Dashboards Student, Teacher y Admin.
- Analítica académica e institucional demo.
- Biblioteca, eventos, casino, pagos y emergencias como módulos demo aislados.
- PWA con manifest, iconos, precache y navegación offline básica.

## Seguridad

- Hardening XSS aplicado a renderizadores dinámicos prioritarios mediante creación segura de nodos DOM, `textContent` y `dataset`.
- Los usos restantes de `innerHTML` están clasificados y documentados como contenido estático o templates controlados.
- UniEcosystemCore permanece aislado. No se activaron `USE_CORE_SESSION`, `USE_CORE_IDENTITY_CANARY`, `USE_CANONICAL_CAREER` ni `USE_CANONICAL_ROOM`.

## Testing realizado

- Sintaxis de JavaScript mediante `node --check`.
- Suite local de pruebas en `tests/`.
- Validación del grafo ESM y del precache PWA.
- `npm test` y `npm run check` en el repositorio separado de UniEcosystemCore.
- `git diff --check` para detectar errores de espacios en cambios locales.

## Limitaciones actuales

- Todos los datos y credenciales son demo.
- No hay backend, API real, autenticación institucional ni autorización de servidor.
- La persistencia de los flujos demo es temporal/en memoria; la aplicación principal conserva el uso local existente cuando corresponde.
- Las métricas administrativas no representan telemetría real.
- Antes de producción faltan pruebas end-to-end, políticas de privacidad, monitoreo y una estrategia de despliegue segura.

## Próximas mejoras

1. Definir backend institucional y contratos de API.
2. Conectar identidad, sesión y autorización reales detrás de los flags de migración.
3. Reemplazar datos demo por fuentes institucionales trazables.
4. Implementar pruebas end-to-end, accesibilidad completa y observabilidad de producción.
5. Definir licencia, política de datos, versión de release y pipeline de CI/CD antes del despliegue.
