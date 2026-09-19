# Contrato de integración institucional LMS — Fase 2.48

Fecha: 2026-09-18
Estado: preparación contractual. No existe conexión, API, URL, credencial ni dato institucional UBO en esta fase.

## 1. Objetivo y límites

Este documento define las fronteras que permitirían conectar en el futuro una fuente institucional autorizada al LMS complementario de UBO Academic Hub. No cambia el comportamiento actual: la autenticación sigue siendo DEMO, PostgreSQL conserva sus datos locales y los fallbacks DEMO permanecen activos.

No se implementaron SSO, sincronización, tablas nuevas, usuarios/cursos/matrículas institucionales, notas oficiales ni asistencia oficial.

## 2. Estado actual de modelos LMS

| Entidad actual | Campos útiles actuales | Qué representa hoy | Límite frente a institución |
| --- | --- | --- | --- |
| `users_reference` | `id`, `external_id`, `name`, `role` | Usuario DEMO local | `external_id` no es identidad institucional verificada. |
| `lms_courses` | `id`, `external_course_id`, `name`, `code`, `teacher_reference`, `description` | Curso LMS DEMO | No tiene período ni estado institucional. |
| `lms_course_members` | `course_id`, `student_reference`, `created_at` | Membresía LMS DEMO | No tiene período, estado de matrícula ni causa de baja. |
| `learning_materials` | curso, título, contenido, tema, keywords | Material local LMS | No prueba procedencia institucional ni derechos editoriales. |
| `lms_evaluations` / `lms_submissions` | curso, docente, estado, preguntas, entrega, `score` | Evaluación LMS complementaria | `score` está documentado como no oficial. |
| `lms_attendance_*` | curso, docente, token hash, presencia, fechas | Sesiones/QR LMS | No equivale a asistencia oficial. |
| `lms_messages` / `lms_notifications` | participantes, curso, contenido, lectura | Comunicación LMS local | No es canal institucional oficial. |
| `user_preferences` | tema, idioma y preferencias opt-in | Preferencias LMS | No contiene identidad ni expediente académico. |
| `auth_sessions` | hash, usuario, fechas, revocación | Sesión local persistente | No es sesión de proveedor institucional. |

## 3. Contrato conceptual de identidad

La futura frontera debe separar proveedor de identidad y usuario local:

```text
Proveedor institucional autorizado
  → identidad institucional validada
  → adaptador de identidad
  → normalizador y validador
  → mapeo identity_provider + institutional_user_id ↔ local_user
  → users_reference / sesión LMS
```

### Identificadores conceptuales requeridos

| Campo conceptual | Uso | Estado actual |
| --- | --- | --- |
| `identityProvider` | Identifica el emisor de identidad autorizado | GAP |
| `institutionalUserId` | Clave estable del titular en ese proveedor | GAP |
| `externalId` | Alias interoperable, solo si el contrato institucional lo garantiza | Existe localmente, no validado institucionalmente |
| `username` | Identificador de acceso, no clave canónica de persona | DEMO |
| `institutionalEmail` | Contacto institucional, si está autorizado por privacidad | GAP |
| `localUserId` | UUID interno LMS para relaciones locales | READY |

Un usuario local puede vincularse a una identidad institucional solamente tras validación del proveedor. No se debe asumir que nombre, correo o username DEMO basten para emparejar personas. La autenticación actual continúa con `password_demo`; no es SSO.

## 4. Contratos conceptuales de curso y matrícula

### Institutional Course → LMS Course

Contrato mínimo futuro de entrada normalizada:

```text
InstitutionalCourse {
  externalCourseId,
  name,
  code,
  teacherReference,
  period,
  status
}
```

`external_course_id`, `name`, `code` y `teacher_reference` tienen equivalentes LMS locales. `period` y `status` son **GAP**: no se deben inventar ni derivar desde fechas de creación.

### Institutional Enrollment → LMS Enrollment

Contrato mínimo futuro:

```text
InstitutionalEnrollment {
  studentReference,
  courseReference,
  period,
  status: ACTIVE | INACTIVE | CANCELLED
}
```

`lms_course_members` ya preserva relaciones estudiante–curso, pero carece de `period`, `status`, fuente y marca de eliminación lógica. Hoy es membresía DEMO, no matrícula oficial.

## 5. Contratos académicos y procedencia

| Dominio | Datos oficiales futuros posibles | Datos LMS/derivados permitidos | Regla |
| --- | --- | --- | --- |
| Evaluaciones | definición oficial, publicación, ponderación, vigencia | preguntas/entregas LMS complementarias | No transformar una evaluación LMS en oficial. |
| Entregas | estado/fecha oficial cuando exista contrato | respuestas y feedback LMS | Conservar fuente y autoridad de cada registro. |
| Notas | resultado oficial, escala y cierre | score LMS/auto-grade demo | La inteligencia solo lee; nunca publica/modifica notas oficiales. |
| Asistencia | registros oficiales y reglas de cómputo | QR/sesiones LMS | No sumar ni reemplazar asistencia oficial sin contrato. |
| Materiales | referencia/contenido autorizado | índice de conocimiento, vistas/eventos LMS | Respetar procedencia y permisos de contenido. |
| Actividad | si se autoriza explícitamente | eventos LMS técnicos mínimos | No inferir comportamiento institucional sin consentimiento y política. |

Todo objeto normalizado debe portar conceptualmente `dataSource: DEMO | LMS | INSTITUTIONAL`, además de su identificador externo, fecha de sincronización y estado de validación. Este campo es una especificación de contrato, no una modificación al esquema actual.

## 6. Flujo futuro de sincronización

```text
Fuente institucional autorizada
  → Adapter por proveedor
  → Normalizer al contrato canónico
  → Validator de formato, identidad y relaciones
  → Idempotent Sync
  → PostgreSQL LMS complementario
  → LMS API
  → Progress / Intelligence / Recommendations / Tutor
```

Requisitos de diseño:

- **Idempotencia:** clave de proveedor + identificador institucional + versión/fecha de origen. Reprocesar un evento no debe duplicar usuario, curso, matrícula ni registro académico.
- **Deduplicación:** no usar nombre o email como única clave. Mantener un mapeo explícito proveedor–identidad local.
- **Actualización:** aplicar cambios solo con versión, marca temporal o política de precedencia acordada.
- **Eliminación lógica:** una baja/cancelación institucional debe conservar trazabilidad, no borrar registros históricos ciegamente.
- **Conflictos:** registrar origen, versión y motivo; no elegir DEMO sobre INSTITUTIONAL sin regla explícita.
- **Errores/reintentos:** colas o bitácoras operacionales, reintentos acotados e idempotentes; nunca recrear datos desde fallos.
- **Observabilidad:** registrar resultado de sincronización sin secretos ni contenido académico innecesario.

No se implementó este flujo ni se definió una API institucional concreta.

## 7. Desacoplamiento de inteligencia

La implementación actual de Progress, Analytics, Intelligence, Recommendations y Tutor consume relaciones LMS normalizadas (`lms_courses`, membresías, materiales, evaluaciones, asistencia y actividad) y no una API institucional externa directa. Por lo tanto, una futura fuente puede sustituir DEMO por INSTITUTIONAL después de normalizar y validar sus datos, sin reescribir esos servicios.

Esto no autoriza a interpretar las actuales reglas deterministas como predicción institucional. Los valores faltantes continúan siendo `null` o `INSUFFICIENT_DATA`.

## 8. Seguridad y privacidad futuras

### Requisitos de seguridad

- SSO OIDC/SAML o mecanismo institucional equivalente validado por UBO; validación de `issuer`, `audience`, firma, expiración y nonce/state cuando aplique.
- Gestión y rotación de secretos fuera de código y de repositorios.
- TLS, separación de ambientes, cuentas de servicio de mínimo privilegio y rotación de credenciales.
- CSRF/origin protection, rate limiting, auditoría de accesos y monitoreo de anomalías.
- Reglas de autorización basadas en la identidad institucional validada y relaciones de matrícula/docencia sincronizadas.

### Mínimo dato necesario

| Consumidor | Datos permitidos en principio | Datos que no necesita |
| --- | --- | --- |
| Student | identidad pública propia, cursos/matrícula propia, contenido autorizado, progreso propio | credenciales, tokens, registros de otros usuarios |
| Teacher | identidad propia, cursos asignados, estudiantes y recursos autorizados | datos de cursos ajenos, contraseñas, sesiones de estudiantes |
| Admin | métricas/agregados y gestión explícitamente autorizada | contenido de Tutor privado, mensajes privados, tokens |
| Intelligence/Recommendations | señales normalizadas y autorizadas mínimas | password, token, datos privados no académicos |
| Tutor/RAG | curso autorizado, conocimiento autorizado y contexto académico mínimo | credenciales, tokens institucionales, datos sensibles no académicos |

La política final debe definir base legal, consentimiento cuando corresponda, retención, minimización, propósito y derechos de acceso/corrección antes de integrar información real.

## 9. Mapeo DEMO → institucional

| Entidad actual | Fuente actual | Futuro origen institucional | Estado |
| --- | --- | --- | --- |
| users | DEMO / PostgreSQL local | identidad institucional autorizada | GAP |
| courses | LMS DEMO | catálogo académico autorizado | GAP |
| enrollments | LMS DEMO | matrícula oficial autorizada | GAP |
| materials | LMS local | contenido/plataforma autorizada | GAP |
| evaluations | LMS local, sin registros actuales | sistema académico autorizado | GAP |
| submissions | LMS local, sin registros actuales | LMS o sistema académico según contrato | GAP |
| official grades | No existen en LMS | fuente de notas oficial | NOT_IMPLEMENTED |
| attendance | LMS/QR local | asistencia oficial autorizada | GAP |
| messages | LMS local, sin registros actuales | canal definido por UBO si aplica | GAP |
| notifications | LMS local, sin registros actuales | servicio institucional si aplica | GAP |
| preferences | LMS local | LMS local salvo política explícita | READY |
| sessions | LMS local | SSO + sesión LMS complementaria | PARTIAL |
| intelligence | derivado LMS | LMS normalizado | READY |
| recommendations | derivado LMS | LMS normalizado | READY |
| Tutor/RAG | conocimiento local LMS | LMS + conocimiento autorizado | PARTIAL |

## 10. Compatibilidad actual y criterios de futura integración

La fase no modifica Student, Teacher, Admin, Course Detail, Progress, Intelligence, Recommendations, Tutor/RAG, Sessions, Notifications ni Preferences. La regresión se valida con las suites actuales; no se habilita ninguna fuente externa.

Antes de integrar, UBO deberá proveer, como mínimo y de forma formal:

1. proveedor/contrato de identidad y claims autorizados;
2. identificadores estables de usuario, curso, período y matrícula;
3. semántica y estados oficiales de cursos, matrícula, evaluaciones, notas y asistencia;
4. contrato de cambios, versiones, frecuencia y manejo de bajas;
5. autorización de datos, privacidad, retención y soporte operativo;
6. canal seguro, ambientes, credenciales de servicio y procedimiento de incidentes.

No se deben inventar endpoints, URLs, tokens, mapeos por nombre, períodos, estados, ponderaciones ni reglas de precedencia antes de recibir esos contratos.

## 11. Qué no se implementó

- Ninguna integración UBO real ni simulada.
- Ningún SSO/OIDC/SAML ni cambio al login DEMO.
- Ninguna tabla, API, migración o sincronización.
- Ningún cambio de datos, fallback, lógica académica o UniEcosystemCore.

## 12. Conclusión

La capa LMS está preparada para recibir datos institucionales **solo a través de un adaptador/normalizador/validador futuro**. Las fronteras de identidad, curso, matrícula, datos oficiales y datos derivados quedaron documentadas sin afirmar una integración que no existe.

Estados de esta fase: `INSTITUTIONAL_CONTRACT_DOCUMENTED`, `DATA_BOUNDARIES_DOCUMENTED`, `IDENTITY_BOUNDARY_DOCUMENTED`, `COURSE_CONTRACT_DOCUMENTED`, `ENROLLMENT_CONTRACT_DOCUMENTED`, `SYNC_CONTRACT_DOCUMENTED`, `SECURITY_REQUIREMENTS_DOCUMENTED`, `PRIVACY_BOUNDARIES_DOCUMENTED`, `DEMO_PRESERVED`, `LMS_INTELLIGENCE_DECOUPLED`, `CORE_UNMODIFIED`.
