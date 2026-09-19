# Institutional Integration Readiness — Fase 2.49

Fecha: 2026-09-18
Naturaleza: auditoría y checklist técnico. No se implementó un adapter, conexión externa, SSO, API, tabla ni dato institucional.

## 1. Estado actual y contraste con Fase 2.48

La Fase 2.48 describió correctamente la separación conceptual entre identidad institucional, datos LMS normalizados y datos derivados. El contraste con el código confirma:

- `users_reference.external_id` y `lms_courses.external_course_id` existen, pero son identificadores DEMO/locales, no valores institucionales confirmados.
- `course_identity_mapping` resuelve aliases legacy/DEMO hacia cursos LMS; no es un adapter ni un contrato con UBO.
- `lms_courses` tiene id, código, nombre, docente y descripción; no tiene período, estado, inicio ni término.
- `lms_course_members` representa relación estudiante–curso, pero no período, estado ni eliminación lógica.
- Progress, Intelligence, Recommendations y Tutor leen contratos LMS normalizados, no una futura API externa. Esa frontera es reutilizable.
- No existe archivo, servicio, ruta o cliente específico de `Institutional Adapter` en `backend/src`, `services/api`, `data` o `core`.

Conclusión: la preparación es **PARTIAL** y conceptual; el inicio de una integración real está **BLOCKED** por ausencia de contrato y fuentes autorizadas.

## 2. Inventario de fuentes requeridas

| Fuente | Necesaria | Estado | Evidencia disponible | Bloquea integración |
| --- | --- | --- | --- | --- |
| Identidad | Sí | MISSING | Login `password_demo` y sesión LMS local | Sí |
| Usuarios | Sí | PARTIAL | Modelo local con `external_id`, nombre y rol | Sí |
| Cursos | Sí | PARTIAL | LMS demo con código/nombre/docente/`external_course_id` | Sí |
| Períodos | Sí | MISSING | No existe en esquema LMS | Sí |
| Docentes | Sí | PARTIAL | Usuario Teacher local y relación de curso | Sí |
| Matrícula | Sí | PARTIAL | `lms_course_members` demo, sin estado/período | Sí |
| Evaluaciones | Sí | PARTIAL | Esquema/API LMS, sin registros actuales | Sí |
| Notas | Sí | MISSING | `score` LMS no oficial; no existe fuente oficial | Sí |
| Asistencia | Sí | PARTIAL | QR/sesiones LMS locales, no oficiales | Sí |
| Materiales | Según alcance | PARTIAL | Materiales LMS locales | No para identidad; sí para contenido oficial |
| Actividad | Según política | PARTIAL | Tabla existente, cero eventos actuales | No inicialmente |
| Autorización | Sí | PARTIAL | Roles y pertenencia LMS locales | Sí |
| SSO | Sí | MISSING | No existe proveedor, protocolo ni configuración | Sí |
| Auditoría | Sí | MISSING | Logs técnicos básicos, sin auditoría de sincronización | Sí |

## 3. Checklist de identidad institucional

La autenticación actual continúa siendo **DEMO**. Para sustituirla se requiere evidencia formal de cada ítem:

- [ ] Proveedor de identidad — MISSING
- [ ] Protocolo (OIDC/SAML o equivalente) — MISSING
- [ ] Issuer — MISSING
- [ ] Client/application registrado — MISSING
- [ ] Redirect URI autorizado — MISSING
- [ ] Scopes mínimos — MISSING
- [ ] Identificador estable (`institutionalUserId`) — MISSING
- [ ] Email institucional autorizado — MISSING
- [ ] Roles/claims y su autoridad — MISSING
- [ ] Contrato de logout — MISSING
- [ ] Expiración de sesión/tokens — MISSING
- [ ] Revocación — MISSING

El LMS ya puede asociar un futuro identificador estable con un `localUserId`, pero no se debe vincular por nombre, username o correo DEMO sin una regla oficial y verificable.

## 4. Usuarios, cursos, períodos y matrícula

### Usuarios

Entrada mínima requerida: `externalId`, `name`, `institutionalEmail`, `role`, `status`. El modelo local puede mapear UUID, `external_id`, nombre y rol; email y estado son **MISSING**. La fuente deberá establecer semántica de rol y baja.

### Cursos

Checklist de entrada:

- [ ] Identificador institucional estable — MISSING (solo existe equivalente DEMO/local)
- [x] Código — PARTIAL (LMS local)
- [x] Nombre — PARTIAL (LMS local)
- [ ] Período — MISSING
- [ ] Estado — MISSING
- [x] Docente de referencia — PARTIAL (LMS local)
- [ ] Fecha de inicio — MISSING
- [ ] Fecha de término — MISSING

### Matrícula

Contrato mínimo requerido: `studentExternalId`, `courseExternalId`, `periodExternalId`, `status`. La relación local estudiante–curso existe, por lo que el vínculo técnico es **PARTIAL**; `period`, estados `ACTIVE/INACTIVE/CANCELLED`, clave de evento institucional, baja lógica y reactivación son **MISSING**.

Estrategia futura, no implementada:

- clave natural: proveedor + identificador institucional de matrícula;
- clave interna: UUID LMS; nunca sustituye la clave institucional;
- actualización: basada en versión/fecha de origen definida por UBO;
- baja/reactivación: cambio lógico y trazable, no borrado físico ciego.

## 5. Datos académicos y asistencia

| Área | Fuente oficial futura requerida | Contrato mínimo conceptual | Estado actual |
| --- | --- | --- | --- |
| Evaluaciones | Sistema académico autorizado | id externo, curso, período, fecha, estado, procedencia | PARTIAL: LMS local sin registros |
| Entregas | LMS/sistema acordado | id externo, evaluación, estudiante, fecha, estado, procedencia | PARTIAL: LMS local sin registros |
| Notas | Fuente oficial de notas | id externo, evaluación, estudiante, período, valor/escala, estado, procedencia | MISSING |
| Asistencia | Fuente oficial autorizada | `sessionExternalId`, curso, estudiante, fecha/hora, `attendanceStatus`, procedencia | PARTIAL: LMS/QR local |

`score` de entrega LMS no es una nota oficial. La inteligencia, el progreso, Tutor y recomendaciones son consumidores de lectura; nunca deben convertirse en fuente de publicación o modificación de datos oficiales.

## 6. Checklist de sincronización futura

| Etapa | Responsabilidad | Entrada | Salida | Errores / logs / reintentos |
| --- | --- | --- | --- | --- |
| Adapter | Obtener únicamente datos autorizados del proveedor | Respuesta/archivo contratado | Registro sin normalizar | Log de fuente y correlación; no secretos |
| Normalizer | Convertir al contrato canónico | Registro de proveedor | Entidad normalizada con fuente | Rechaza campos/semántica desconocida |
| Validator | Validar identidad, relación y período | Entidad normalizada | Registro válido o error explícito | Error estructurado y trazable |
| Idempotency | Evitar duplicados | Clave externa + versión | Decisión create/update/no-op | Detecta duplicado/conflicto |
| Persistence | Persistir cambios autorizados | Decisión validada | Estado LMS actualizado | Transacción y resultado auditado |
| LMS API | Exponer solo datos autorizados | Estado normalizado | Respuesta con origen | No mezcla datos DEMO e INSTITUTIONAL |

Claves conceptuales: `externalUserId`, `externalCourseId`, `externalEnrollmentId`, `externalEvaluationId`, `externalAttendanceId`, cada una calificada por proveedor y versión. No son valores actuales ni se inventaron.

Para create, update, deactivate, reactivate, duplicate y conflict se necesitarán reglas de precedencia, versionado, timestamp, borrado lógico y responsable técnico definidos por UBO.

## 7. Data source y fallback

El código actual ya declara `source: "LMS"` y `dataSource: "LMS"` en varios servicios, mientras los clientes UI conservan fallback DEMO/local. `course_identity_mapping.source` en seed usa `DEMO`. `INSTITUTIONAL` es un valor futuro conceptual: no está implementado ni debe presentarse en UI como origen actual.

La futura UI debe mantener separación visible de origen: `INSTITUTIONAL`, `LMS`, `DEMO`. La integración no puede eliminar fallback DEMO hasta que fuente, calidad, autorización y rollback estén aprobados.

## 8. Seguridad, privacidad, observabilidad y ambientes

### Seguridad antes de integrar

- [ ] HTTPS/TLS de extremo a extremo
- [ ] Secretos fuera de código
- [ ] Variables de entorno por ambiente
- [ ] Rotación de secretos
- [ ] Scopes mínimos
- [ ] Validación de issuer
- [ ] Validación de audience
- [ ] Expiración y revocación
- [ ] CSRF/origin policy completa
- [ ] Rate limiting
- [ ] Auditoría
- [ ] Logs sin secretos
- [ ] Separación DEV/QA/PROD

### Privacidad por mínimo privilegio

| Dato | Necesario | Usuario que lo necesita | Debe persistir | Sensibilidad |
| --- | --- | --- | --- | --- |
| Identidad | Sí, mínima | Rol autorizado | Mapeo mínimo | Alta |
| Email institucional | Solo si contrato lo justifica | UI/soporte autorizado | Preferiblemente no, salvo propósito | Alta |
| Curso / matrícula | Sí | Student, Teacher, Admin autorizado | Sí, según contrato | Media |
| Nota oficial | Solo para vista autorizada | Student propio / rol habilitado | Según fuente y política | Alta |
| Asistencia oficial | Solo para vista autorizada | Student propio / rol habilitado | Según fuente y política | Alta |
| Actividad | Solo si aprobada | Servicios derivados autorizados | Mínima y acotada | Media/Alta |
| Mensajes | Sí, para participantes | Remitente/destinatario | Según retención | Alta |
| Tutor | Contexto mínimo | Student propio | Historial solo si se aprueba | Media/Alta |
| Recomendaciones / inteligencia | Señales mínimas | Student propio y agregados autorizados | Derivado; no oficial | Media |

Observabilidad futura: registrar inicio/fin, fuente, correlación, duración, procesados, creados, actualizados, desactivados, duplicados y errores. Nunca password, token, cookie, secreto ni cuerpo académico innecesario.

DEV, QA y PROD deberán tener fuentes, bases, credenciales, configuraciones y secretos separados. Desarrollo local no debe conectarse directamente a una fuente institucional.

## 9. NO IMPLEMENTAR ADAPTER HASTA QUE

Todos los siguientes son requeridos; mientras falte alguno, estado **BLOCKED**:

1. contrato de identidad real;
2. fuente de usuarios;
3. catálogo de cursos;
4. fuente de matrícula;
5. fuente académica;
6. fuente de asistencia;
7. identificadores estables;
8. ambiente de pruebas;
9. credenciales de prueba aprobadas;
10. reglas de autorización;
11. reglas de actualización/baja/conflicto;
12. contacto y responsable técnico institucional.

Los criterios de salida `INSTITUTIONAL_SOURCE_CONFIRMED`, `IDENTITY_CONTRACT_CONFIRMED`, `COURSE_SOURCE_CONFIRMED`, `ENROLLMENT_SOURCE_CONFIRMED`, `ACADEMIC_SOURCE_CONFIRMED`, `ATTENDANCE_SOURCE_CONFIRMED`, `IDENTIFIERS_CONFIRMED`, `TEST_ENVIRONMENT_CONFIRMED`, `SECURITY_REQUIREMENTS_CONFIRMED` y `PRIVACY_REQUIREMENTS_CONFIRMED` quedan **NOT_TESTED/MISSING**, sin evidencia real.

## 10. Regresión y tests

No se modificó comportamiento de Student, Teacher, Admin, Course Detail, Progress, Intelligence, Recommendations, Tutor, Sessions, Notifications ni Preferences. La regresión se comprueba mediante las suites actuales; no se activa integración externa.

| Validación | Resultado real |
| --- | --- |
| Frontend `node --test tests/*.test.js` | 113/113 aprobadas |
| Backend `npm test` | 51/51 aprobadas |
| Sintaxis UBO | 300 archivos JavaScript, 0 fallos |
| Core `npm test` | Aprobado |
| Core `npm run check` | Aprobado |
| `git diff --check` | Sin errores de whitespace; avisos LF/CRLF preexistentes |

La raíz del frontend no contiene `package.json`; por ello `npm test`/`npm run check` allí devuelven `ENOENT` y no representan una suite omitida. Las suites aplicables se ejecutaron desde la raíz frontend, `backend` y `UniEcosystemCore`.

## 11. Resultado

La arquitectura actual no necesita rehacerse para incorporar una fuente futura: el almacenamiento LMS, sus servicios de lectura y las capas derivadas ya pueden consumir datos normalizados. Lo que falta no es un adapter vacío, sino contrato institucional verificable, entorno de QA, seguridad, reglas de negocio y fuentes autorizadas.
