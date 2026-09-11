# Resumen avanzado del Dashboard Administrativo

## Objetivo

La Fase 1.91 agrega una lectura institucional demo para el panel ADMIN. Las métricas describen el estado de los datos demo sin habilitar CRUD, cambios de permisos ni operaciones académicas.

## Métricas y fuentes

El servicio usa perfiles de `data/users.js`, cursos existentes y las consultas locales de material, notas, asistencia, avisos y alertas. Deriva conteos de usuarios demo, cursos, actividad académica, actividad reciente y alertas generadas.

## Aislamiento y seguridad

La capa es de solo lectura, no administra almacenamiento propio y no exporta acciones de escritura. El nuevo renderizado del panel crea nodos y usa `textContent` para los datos dinámicos.

## Degradación y límites

Si una fuente falla, la respuesta conserva las métricas de las demás fuentes y registra una advertencia controlada. Los valores son demostrativos y no son estadísticas oficiales ni de producción.

## Pruebas

`tests/admin-dashboard-summary.test.js` cubre conteos, actividad, aislamiento de cursos, datos vacíos, fuente corrupta, determinismo, copias defensivas y contrato de solo lectura.
