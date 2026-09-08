# Auditoría de separación: UniEcosystemCore / UboAcademicHub

## 1. Resumen ejecutivo

El repositorio es una PWA estática sin `package.json` ni dependencias de runtime declaradas. Conviven tres capas: la aplicación UBO legacy (`index.html`, `app.js`, `styles.css`), una arquitectura futura parcialmente genérica (`core`, modelos, adapters y servicios) y módulos DEMO aislados.

La separación es viable, pero **no debe ejecutarse todavía**. El núcleo académico sigue bloqueado por decisiones institucionales sobre Course / Section / Offering, período y Enrollment. La recomendación es extraer gradualmente un Core por paquetes o workspaces, manteniendo UBO como una implementación/configuración separada y evitando copiar modelos o servicios.

## 2. Arquitectura actual

| Área actual | Función | Clasificación | Confianza | Riesgo de mover |
|---|---|---|---|---|
| `app.js` | Aplicación estudiante, datos, navegación y persistencia local | UBO + LEGACY | Alta | Alto |
| `index.html`, `styles.css` | Shell PWA, UI, branding y pantallas UBO | UBO + LEGACY | Alta | Alto |
| `core/permissions.js`, `core/session.js`, `core/router.js` | Roles, sesión y rutas futuras aisladas | CORE | Media | Medio |
| `data/models/` | Contratos académicos futuros sin datos UBO | CORE | Alta | Bajo |
| `data/university/` | Fuentes institucionales DEMO | DATA-INSTITUTIONAL | Alta | Bajo |
| `data/mappings/` | Equivalencias legacy/UBO hacia IDs futuros | UBO / DATA-INSTITUTIONAL | Alta | Medio |
| `services/adapters/` | Transformación pura entre fuentes actuales y modelos | CORE, salvo los aliases UBO | Media | Medio |
| `services/*-service.js` | Consultas DEMO y servicios institucionales | PENDING-DECISION | Media | Medio |
| `modules/professor`, `modules/admin` | Interfaces DEMO institucionales | CORE UI configurable + UBO demo | Media | Medio |
| `modules/demo/` | Entornos de demostración y ejemplos | LEGACY / examples futuros | Alta | Bajo |
| PWA, iconos, Qodana y GitHub Actions | Operación y calidad del repositorio | CONFIG / INFRASTRUCTURE | Alta | Bajo |

## 3. Clasificación Core / UBO

### Destinados a UniEcosystemCore

- Modelos canónicos: User, Student, Teacher, Career, Room, Schedule, Course, Enrollment, Evaluation, Grade, Attendance y Material. Son contratos conceptualmente reutilizables, aunque varios aún requieren aprobación institucional.
- Roles, permisos, sesión futura y router futuro, siempre que rutas y permisos se parametrizen por implementación.
- Patrones puros de adapters, validación, copias defensivas y servicios read-only.
- Lógica genérica de dominios: biblioteca, eventos, casino, pagos, emergencias, acciones administrativas y acciones docentes; sus datos y políticas no deben viajar dentro del Core.
- Componentes UI reutilizables futuros: tarjetas, filtros, formularios, listados, estados vacíos y layouts responsive. Actualmente están mezclados en CSS/HTML UBO y no son extraíbles sin trabajo posterior.

### Específico de UboAcademicHub

- Marca, nombre, colores, logo, iconos UBO y manifest actual.
- Pantalla principal legacy, navegación, textos, flujos de documentos, DAE, Campus UBO, correo `@pregrado.ubo.cl`, RUT y credencial UBO.
- Datos y contenidos de carreras, campus, facultades, salas, servicios, actividades, comunicaciones y material demostrativo UBO.
- Mappings de nombres legacy UBO e IDs de transición.
- Configuración PWA actual: `manifest.json`, `service-worker.js`, nombre de caché e iconos.

### Pendiente de decisión antes de clasificar definitivamente

- Course, Enrollment, Evaluation, Grade, Attendance y Material: la lógica puede ser Core, pero sus contratos, políticas y fuentes institucionales no están aprobados.
- Paneles Student, Teacher y Admin: el comportamiento general puede formar parte del Core; su navegación, branding, módulos habilitados y datos deben pertenecer a cada implementación.
- `services/course-service.js`, `student-service.js`, `professor-service.js`, Grade, Attendance y Material: contienen patrones reutilizables, pero hoy dependen directamente de datos DEMO institucionales.

## 4. Datos institucionales

`data/university/` contiene fuentes DEMO para analytics, attendance, careers, casino, courses, emergencies, events, grades, library, materials, payments, rooms y schedules. Deben quedar fuera de Core como fixtures, ejemplos o configuración de implementación.

| Fuente | Dominio | Estado | Destino propuesto |
|---|---|---|---|
| `careers.js`, `courses.js`, `rooms.js`, `schedules.js` | Académico | DEMO institucional | DATA-INSTITUTIONAL / fixtures UBO |
| `grades.js`, `attendance.js`, `materials.js` | Académico | DEMO parcial | DATA-INSTITUTIONAL; no migrar aún |
| `library.js`, `events.js`, `casino.js`, `payments.js`, `emergencies.js` | Servicios | DEMO | DATA-INSTITUTIONAL / examples |
| `analytics.js` | Métricas | DEMO | DATA-INSTITUTIONAL / fixture |
| `data/users.js`, `students.js`, `professors.js`, `courses.js` | Usuarios y transición | DEMO / pendiente | UBO fixtures, no Core |

No se detectó una fuente institucional real. Los datos actuales son demostrativos y no deben venderse ni interpretarse como datos de una universidad productiva.

## 5. Configuración futura

Valores actualmente hardcodeados que deberían convertirse en configuración de implementación:

| Valor | Ubicación actual | Estado futuro |
|---|---|---|
| Nombre, sigla, logo y color institucional | HTML, CSS, manifest, iconos | CONFIGURABLE |
| Dominio de correo y validación de identidad | `app.js` | CONFIGURABLE |
| Carreras, campus, salas, calendario y servicios | `app.js`, `data/university` | DATA-INSTITUTIONAL |
| Módulos habilitados y navegación | `index.html`, `app.js` | CONFIGURABLE |
| Flags Career y Room | `app.js` | CONFIGURABLE por implementación |
| PWA y caché | manifest/service worker | INFRASTRUCTURE específica por implementación |

## 6. Dependencias críticas

- `app.js` depende de DOM, `localStorage`, textos UBO, datos legacy y navegación propia: no es Core puro.
- Career y Room usan bridges read-only con flags apagados; son la única conexión controlada entre app legacy y arquitectura futura.
- Los servicios de Course, Student, Professor, Grade, Attendance y Material leen `data/university`, por lo que no son Core puros todavía.
- Panel Profesor consume servicios DEMO y DOM; es una interfaz de referencia, no un paquete Core independiente.
- Módulos demo consumen servicios y action-services específicos; deben tratarse como examples o fixtures.

No se observó que los modelos canónicos, adapters de Career/Room/Schedule ni servicios canónicos read-only dependan de DOM, `localStorage`, login, router o `app.js`.

## 7. Análisis de `app.js`

`app.js` concentra datos demo, autenticación demo, sesión local, navegación, renderizado, módulos académicos, servicios universitarios, branding, validaciones UBO, integraciones de calendario y acciones UI. Debe permanecer temporalmente como **UBO LEGACY** para compatibilidad.

Posibles extracciones futuras, sin implementarlas ahora:

- UI genérica y utilidades: Core, después de desacoplar textos y estilos UBO.
- Datos, textos, validaciones de correo/RUT, campus y marca: UBO/configuración.
- Navegación y sesiones: adaptador de implementación sobre Core.
- Módulos funcionales: Core configurable solo después de separar UI, datos y políticas.

## 8. Modelos canónicos

Los modelos son los mejores candidatos a Core porque no contienen datos UBO. Sin embargo, no todos son contratos aprobados:

- Career y Room: listos para lectura con advertencias.
- Schedule: parcial; falta estado institucional.
- Course, Enrollment, Evaluation, Grade, Attendance y Material: PENDING-DECISION/BLOQUEADOS.
- User, Student y Teacher: Core conceptual, con fuentes actuales aún DEMO.

No se deben duplicar modelos entre Core y UBO. UBO debe depender de una versión concreta del paquete de modelos.

## 9. Servicios, adapters y bridges

| Componente | Clasificación propuesta | Observación |
|---|---|---|
| Career/Room adapters, services y bridges | CORE + configuración UBO | Actualmente usan mappings/fuentes UBO; el mecanismo es reutilizable |
| Schedule adapter/service | CORE parcial | Estado y período requieren fuente institucional |
| Course/Student/Professor services | PENDING-DECISION | Dependen directamente de fixtures institucionales |
| Grade/Attendance/Material services | DEMO / PENDING-DECISION | Escritura en memoria, contratos bloqueados |
| Action services | CORE pattern / policy pendiente | Validaciones reutilizables, permisos y estados no aprobados |
| `auth-service.js`, `api-client.js`, `storage.js` | CORE placeholder | Sin implementación funcional |
| Demo selector/router | UBO demo / examples | Rutas y usuarios de demostración actuales |

Los bridges de Career y Room son los únicos apropiados hoy. No se justifica crear bridges para dominios bloqueados.

## 10. Módulos funcionales y demos

- **Student actual:** implementación UBO legacy.
- **Teacher/Admin:** referencia UI configurable, hoy ligada a datos DEMO UBO.
- **Biblioteca, Eventos, Casino, Pagos y Emergencias:** dominios potencialmente Core, con datos, políticas, textos y branding actuales como configuración o fixture institucional.
- **`modules/demo/*`:** deben permanecer temporalmente como demostraciones. A futuro conviene moverlos a `examples/` o a una aplicación de sandbox, no incorporarlos al producto final como lógica productiva.

## 11. Arquitectura objetivo conceptual

```text
UniEcosystemCore
  ├─ domain/             modelos, reglas puras y contratos versionados
  ├─ application/        servicios, casos de uso y permisos genéricos
  ├─ ui/                 componentes y layouts sin marca
  ├─ adapters/           contratos para datos, auth, storage y notificaciones
  └─ testing/            fixtures genéricos y pruebas de contrato

UboAcademicHub
  ├─ config/             marca, módulos, flags y navegación UBO
  ├─ data/               fixtures, mappings e integraciones UBO
  ├─ adapters/           conectores a sistemas UBO futuros
  ├─ ui/                 composición, contenido y tema UBO
  └─ pwa/                manifest, iconos y service worker UBO
```

La estructura exacta debe adaptarse al stack que se elija cuando se introduzca un gestor de paquetes; el proyecto actual no tiene workspaces ni paquetes configurados.

## 12. Estrategia multiuniversidad

Recomendación: **Core + AcademicHub por institución**, con una evolución posterior a multi-tenant solo cuando exista backend y una operación compartida real.

- **Multi-instance:** ofrece máximo aislamiento y menor riesgo inicial; implica mantenimiento de varias implementaciones.
- **Multi-tenant:** simplifica operación central, pero exige separación fuerte de datos, autorización, auditoría y configuración; no es adecuada para el frontend DEMO actual.
- **Core + AcademicHub:** permite reutilizar contratos, servicios y componentes mientras cada universidad conserva branding, configuración, adapters y datos propios.

La combinación recomendada es Core versionado + implementaciones institucionales separadas; un backend multi-tenant puede añadirse después sin convertir la PWA actual en tenant compartido prematuramente.

## 13. Actualizaciones y compatibilidad

- Versionar Core semánticamente: `MAJOR` para contratos incompatibles, `MINOR` para capacidades compatibles y `PATCH` para correcciones.
- UboAcademicHub debe fijar rangos de versión compatibles y mantener pruebas de contrato contra Core.
- Breaking changes requieren migración explícita, compatibilidad temporal, rollback documentado y feature flags por implementación.
- Los modelos, servicios, utilidades y componentes no deben copiarse: se consumen como dependencia/versiones compatibles.

## 14. Seguridad

- No se encontraron API keys, tokens ni secretos de backend hardcodeados.
- El workflow Qodana referencia un secreto de GitHub por nombre; no expone su valor en el repositorio.
- `app.js` contiene contraseñas, RUT y correos de demostración; deben mantenerse inequívocamente como demo y eliminarse de cualquier entrega productiva.
- No existen archivos `.env` rastreados; `.gitignore` los excluye.
- URLs externas encontradas corresponden a configuración de Qodana, documentación o validación de URLs demo; no se detectaron URLs internas privadas.

## 15. Propiedad técnica

La clasificación es técnica, no legal:

- Modelos, contratos, patrones de servicios y UI genérica están destinados a formar parte del Core.
- Branding, configuraciones, contenido, datos y adaptadores UBO están destinados a la implementación UBO.
- Workflows, iconos, PWA y dependencias de terceros requieren revisión de licencia y titularidad antes de redistribución.

## 16. Riesgos y problemas pendientes

1. `app.js` es un monolito UBO legacy; extraerlo sin pruebas de regresión tendría riesgo alto.
2. Datos DEMO y servicios reutilizables están mezclados en algunos servicios académicos.
3. Course/Enrollment bloquean la normalización de gran parte del núcleo académico.
4. No hay mecanismo de paquetes/workspaces ni contratos de integración entre Core e implementación.
5. Los permisos futuros existen, pero no están conectados a autenticación institucional.

## 17. Plan de separación, sin implementación

1. Aprobar el núcleo académico pendiente con UBO u otra institución piloto.
2. Establecer un repositorio o workspace para Core y contratos versionados.
3. Mover primero solo modelos y utilidades puras ya aprobados.
4. Extraer configuración institucional y fixtures sin cambiar la app UBO.
5. Convertir módulos demo en examples con datos genéricos.
6. Definir adapters institucionales para auth, datos, storage y notificaciones.
7. Migrar read-only por dominios con flags y fallback.
8. Mantener pruebas de contrato, regresión y rollback por implementación.

## 18. Recomendaciones

- No crear un segundo Core dentro del repositorio actual todavía.
- No copiar `app.js`, modelos ni servicios entre futuras universidades.
- No activar migraciones académicas hasta resolver Course/Section/Offering y Enrollment.
- Mantener `data/university` como fixture/configuración institucional externa al Core.
- Priorizar pruebas de contrato y una configuración institucional explícita antes de cualquier extracción física.
