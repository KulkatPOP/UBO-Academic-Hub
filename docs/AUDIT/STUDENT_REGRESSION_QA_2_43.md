# QA integral Student post-sesión persistente — Fase 2.43

Fecha: 2026-09-15
Alcance: regresión Student posterior a Fase 2.42, con datos LMS existentes y sin modificar Core, notas oficiales, asistencia oficial ni matrícula.

## Resultado

La sesión persistente de backend fue validada contra PostgreSQL con una cookie `HttpOnly` y `SameSite=Lax`. La identidad restaurada después de reiniciar Express se mantuvo autorizada para las rutas privadas. No se imprimieron credenciales, cookies ni hashes durante la prueba.

| Caso | Resultado | Evidencia |
|---|---|---|
| Login Student | OK | `POST /api/auth/login` respondió 200 y emitió cookie con atributos esperados. |
| Restauración/reinicio de Express | OK | La misma cookie obtuvo 200 en `/api/users/me` y `/api/courses` después de detener e iniciar Express. |
| Dashboard y cursos LMS | OK por API | `/api/courses` y detalle de Bases de Datos respondieron 200. |
| Course Detail LMS | OK | Curso existente, 3 materiales, asistencia 1/2 (50%), `overall: null` y tendencia `INSUFFICIENT_DATA`. |
| Inteligencia | OK | Riesgo `HIGH` con señal `LOW_ATTENDANCE_LMS`. |
| Recomendaciones | OK | `/api/recommendations/intelligent` devolvió `REVIEW_MATERIAL`, prioridad alta y recurso `Clave primaria`. |
| Tutor | OK | `POST /api/tutor/ask` respondió 200 con el contexto autorizado del curso. |
| Mensajes y notificaciones | OK | Ambas lecturas respondieron 200 y permanecieron filtradas por sesión. |
| Logout | OK | `POST /api/auth/logout` respondió 204; la siguiente lectura privada respondió 401. |
| Spoofing de usuario/rol | OK | Los encabezados falsos no cambiaron la identidad de la cookie; curso ajeno respondió 404. |
| Datos en localStorage | Parcial | No se pudo leer programáticamente el almacenamiento del perfil de Chrome mediante la herramienta de QA. La prueba de clientes y la sesión persistente verifican que la sesión pública no almacena contraseña; no se inspeccionó una cookie ni token. |
| Login y cierre/apertura de navegador por UI | NOT_TESTED | La pestaña de Chrome ya poseía una sesión local heredada sin cookie backend. No se sobrescribió ni se ingresaron credenciales en la UI durante la auditoría. |
| Responsive 390/768/1920 y tema claro/oscuro | NOT_TESTED en esta fase | No hubo cambios CSS/UI en Fase 2.42. La evidencia visual previa de Fase 2.40 se conserva, pero no sustituye una ejecución nueva. |
| Consola | OK | La inspección del tab Student no devolvió errores de consola. |
| PWA y datos privados | OK por revisión | El Service Worker no incorpora `/api/*` al precache; las solicitudes privadas no se almacenan mediante `cache.put`. |

## Corrección mínima aplicada

Se detectó una diferencia real entre el contrato del Course Detail y la fuente que mostraba sus recomendaciones:

- Antes, `services/api/course-detail-api-service.js` consultaba la lista histórica `/api/recommendations`.
- Ahora consume `getIntelligentRecommendations({ courseId })`, que usa `/api/recommendations/intelligent/:courseId`.
- La tarjeta conserva DOM seguro y presenta `REVIEW_MATERIAL`, su motivo y el título del recurso cuando la API los entrega.
- Se preservó el inyector histórico `getRecommendationsImpl` sólo para compatibilidad de pruebas/adaptadores existentes.

No se modificaron fuentes LMS, datos académicos, permisos ni Core.

## HTTP real verificado

Se comprobó, sin registrar secretos:

```text
login → 200
courses antes de reiniciar Express → 200
/api/users/me después de reiniciar → 200
/api/courses después de reiniciar → 200
Course Detail y materiales → 200
progress → 200
intelligence → 200
recommendations/intelligent → 200
tutor → 200
notifications → 200
messages → 200
logout → 204
request privada post-logout → 401
```

## Validaciones técnicas

- `node --check`: 299 archivos JavaScript, sin errores de sintaxis.
- Suite frontend: 111 pruebas correctas.
- Suite backend: 51 pruebas correctas.
- `git diff --check`: sin errores de espacios; Git informó únicamente avisos CRLF de archivos preexistentes.
- `UniEcosystemCore`: no modificado.

## Limitaciones y siguiente verificación

1. Ejecutar manualmente el login institucional en un perfil de navegador limpio y comprobar recarga/cierre-apertura con la cookie real.
2. Repetir la matriz visual de 390 px, 768 px y 1920 px en claro y oscuro después de esa sesión limpia.
3. Usar DevTools de un perfil local para inspeccionar que `uboAcademicSession` tenga sólo campos públicos, sin exponer valor de cookie ni credenciales.

## Estado de criterios

`STUDENT_SESSION_OK`, `STUDENT_SESSION_RESTART_OK`, `STUDENT_COURSES_OK`, `COURSE_DETAIL_LMS_OK`, `PROGRESS_UI_OK` (API), `INTELLIGENCE_UI_OK` (API), `RECOMMENDATIONS_UI_OK` (API), `TUTOR_UI_OK` (API), `MESSAGES_UI_OK` (API), `NOTIFICATIONS_UI_OK` (API), `LOGOUT_OK`, `POST_LOGOUT_BLOCKED`, `USER_SPOOFING_BLOCKED`, `ROLE_SPOOFING_BLOCKED`, `COURSE_ISOLATION_OK`, `CONSOLE_OK`, `NETWORK_OK`, `PWA_PRIVATE_DATA_SAFE`, `STUDENT_REGRESSION_OK`, `CORE_UNMODIFIED`.

`STUDENT_SESSION_RESTORE_OK` por navegador, `LIGHT_MODE_OK`, `DARK_MODE_OK` y `RESPONSIVE_OK` quedan `NOT_TESTED` específicamente en esta ejecución.
