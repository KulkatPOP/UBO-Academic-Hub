# Dashboard docente LMS API-first

## Alcance

El panel y el detalle docente conservan las vistas DEMO como fallback y consumen el LMS cuando hay una sesión backend disponible. La composición de lectura se concentra en `services/api/teacher-dashboard-api-service.js`; no crea un agregado backend nuevo ni modifica información académica oficial.

El dashboard docente representa información operativa derivada del LMS Academic Hub y no constituye información académica oficial de la Universidad.

## Autorización y privacidad

`GET /api/courses` resuelve el rol desde `users_reference` a partir de `x-user-id`. El nuevo endpoint mínimo `GET /api/courses/:courseId/students` exige el rol `TEACHER` y que `lms_courses.teacher_reference` coincida con ese usuario. Su respuesta sólo expone `id`, `name` y `role`; no devuelve credenciales. Parámetros como `role`, `teacherId` o `userId` no participan en la autorización.

## Datos mostrados

Para cada curso autorizado se consultan de forma independiente estudiantes, materiales, evaluaciones, asistencia QR/LMS, mensajes y analítica. Las evaluaciones se etiquetan como LMS; no se convierten en notas oficiales. Las entregas sólo se muestran cuando la API existente las proporciona. Cuando una fuente está vacía se muestra un estado vacío; cuando falla se muestra `Datos LMS insuficientes`, sin convertirlo en cero.

## Fallback y errores parciales

La composición protege cada consulta: una falla parcial no impide usar las restantes. Si Courses API no está disponible, el dashboard DEMO original permanece como fallback y está identificado como DEMO. Las acciones de escritura DEMO del detalle se deshabilitan al visualizar un curso LMS para no mezclar persistencias locales con la lectura LMS.

## Limitaciones

No hay segundo profesor demo en la base real para una prueba HTTP de curso ajeno; ese escenario se cubre con un fixture de backend que usa otro `teacher_reference`. El endpoint de progreso sigue siendo de Student y no se duplicó. No se crearon métricas de entregas, rendimiento o asistencia cuando faltaban datos.

## PWA

El precache se actualizó a `ubo-academic-hub-v177` e incluye el cliente de composición docente. No incorpora UniEcosystemCore ni dependencias externas.
