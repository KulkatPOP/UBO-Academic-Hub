# UBO Academic Hub — LMS Inteligente

## Slide 1 — Portada

**UBO Academic Hub**
**LMS Inteligente**
**Release 1.0**

LMS local funcional preparado para futura integración institucional.

> No está integrado con sistemas institucionales reales de UBO.

## Slide 2 — Problema

Los flujos académicos de una comunidad universitaria requieren experiencias distintas para Student, Teacher y Admin: consulta de cursos, progreso, asistencia, materiales, gestión docente y visión agregada. El proyecto aborda este escenario con un LMS local demostrativo y una arquitectura documentada para una futura integración institucional.

## Slide 3 — Propuesta

UBO Academic Hub ofrece una base local con:

- LMS por rol.
- Gestión de cursos, estudiantes, materiales, asistencia y progreso.
- Inteligencia académica determinista y explicable.
- Recomendaciones sobre recursos LMS autorizados.
- Tutor contextualizado con recuperación de conocimiento local (RAG).
- Dashboards diferenciados para Student, Teacher y Admin.

## Slide 4 — Usuarios

| Rol | Alcance actual |
| --- | --- |
| **Student** | Dashboard, cursos, Course Detail LMS, materiales, progreso, asistencia, recomendaciones, Tutor/RAG y logout. |
| **Teacher** | Cursos propios, estudiantes, Course Detail, materiales, evaluaciones LMS, asistencia, avisos y analítica. |
| **Admin** | Overview y métricas agregadas del LMS. |

Los roles se resuelven en backend para las rutas LMS privadas.

## Slide 5 — Arquitectura

```text
Frontend PWA (ES Modules)
          ↓
      Express API
          ↓
 PostgreSQL local (Docker)
          ↓
 LMS y servicios derivados
          ↓
 Progress · Intelligence · Recommendations · Tutor/RAG
```

El frontend conserva fallback DEMO/local controlado cuando la API no está disponible. UniEcosystemCore se mantiene separado.

## Slide 6 — LMS

```text
Usuario → curso → materiales → progreso → asistencia → evidencia LMS
```

La evidencia se obtiene del LMS local y se presenta sin convertir valores faltantes en datos inventados. Los datos actuales son DEMO/LMS local, no fuentes académicas oficiales de UBO.

## Slide 7 — Inteligencia académica

- Motor de reglas **determinista**, no Machine Learning.
- Usa evidencia LMS disponible y produce señales explicables.
- Opera en modo de solo lectura: no modifica notas, asistencia ni matrícula.
- No inventa evidencia ni tendencias.
- Cuando falta evidencia suficiente, expone `INSUFFICIENT_DATA` o valores `null`.

No representa una predicción institucional de rendimiento futuro.

## Slide 8 — Recomendaciones

```text
Señal LMS
   ↓
Decisión
   ↓
Recurso LMS autorizado
```

Ejemplo real del proyecto:

```text
LOW_ATTENDANCE_LMS → REVIEW_MATERIAL → “Clave primaria”
```

El recurso se recupera desde material/conocimiento local autorizado del LMS; no se fabrica una recomendación cuando falta señal o recurso verificable.

## Slide 9 — Tutor + RAG

```text
Curso autorizado + conocimiento RAG local + contexto LMS + recomendaciones
                              ↓
                    Tutor contextualizado
```

El Tutor consulta conocimiento local autorizado y contexto LMS del curso permitido. No usa APIs de modelos externos, no envía datos a terceros y reconoce falta de evidencia antes de responder con conclusiones académicas.

## Slide 10 — Seguridad actual

- Sesiones persistentes LMS en PostgreSQL.
- Cookie `HttpOnly`, `SameSite=Lax`, expiración y logout revocable.
- Token persistido solo como hash en la base local.
- Aislamiento Student/Teacher/Admin y pertenencia de curso resueltos por backend.
- Protección ante spoofing de headers de rol/identidad.
- Las rutas privadas `/api/*` no se precachean en la PWA.

Estas medidas corresponden a un alcance local DEMO; no sustituyen SSO, CSRF ampliado, rate limiting, TLS productivo ni gestión corporativa de secretos.

## Slide 11 — Experiencia visual

- Light Mode y Dark Mode.
- Interfaces para Student, Teacher y Admin.
- Diseño responsive validado en `390×844`, `768×1024` y `1920×1080`.
- Course Detail y tarjetas ajustadas sin overflow horizontal durante la auditoría visual registrada.

## Slide 12 — Experiencia móvil

- Diseño responsive para Student, Teacher y Admin.
- Navegación adaptada para pantallas pequeñas.
- Tema claro y oscuro.
- Acceso a cursos, LMS y funciones principales desde dispositivos móviles.
- Validado en viewport móvil y tablet.

`[INSERTAR AQUÍ CAPTURA REAL DEL MODO OSCURO EN MÓVIL]`

## Slide 13 — Guion de demostración

1. Login como Sofía.
2. Dashboard.
3. Mis Ramos.
4. Bases de Datos.
5. Datos LMS.
6. Inteligencia.
7. Recomendación.
8. Tutor.
9. Logout.
10. Login como Carlos.
11. Dashboard Teacher.
12. Curso.
13. Logout.
14. Login Admin.
15. Overview.
16. Logout.

El guion detallado está en `LIVE_DEMO_SCRIPT_1_0.md`.

## Slide 14 — Estado del proyecto

| Área | Evidencia |
| --- | --- |
| Frontend | 113/113 pruebas aprobadas |
| Backend | 51/51 pruebas aprobadas |
| Core | `npm test` y `npm run check` aprobados |
| Sintaxis Node | Sin errores en validaciones realizadas |
| PWA/ESM | Pruebas existentes aprobadas |
| Responsive | Auditoría documentada |
| Dark Mode | Auditoría documentada |

## Slide 15 — Integración institucional

```text
ACTUALMENTE                    FUTURO, CON CONTRATOS UBO
LMS local + datos DEMO          SSO + usuarios institucionales
                                cursos + matrícula + notas
                                asistencia + fuentes oficiales
```

La integración institucional no forma parte de Release 1.0.

## Slide 16 — Preparación para UBO

Ya existe:

- Separación de capas frontend, API, datos y servicios derivados.
- Contrato documental de integración y evaluación de readiness.
- Frontera institucional explícita.
- LMS normalizado para recursos propios.
- Servicios derivados desacoplados y documentación de handover.

UBO deberá proporcionar identidad/SSO, identificadores estables, datos autorizados, períodos, matrícula, reglas de actualización, ambiente QA y un responsable técnico.

## Slide 17 — Limitaciones

- Datos, identidades y métricas DEMO/LMS local.
- Sin SSO ni fuente institucional UBO.
- Sin sincronización institucional.
- Requisitos operacionales de producción pendientes.
- `LICENSE_STATUS = NOT_DEFINED`.

## Slide 18 — Valor de la entrega

La entrega contiene:

- LMS funcional y PWA.
- Frontend, backend Express y migraciones PostgreSQL locales.
- Inteligencia determinista, recomendaciones y Tutor/RAG local.
- Módulos por rol, pruebas, documentación y handover.
- Frontera y contratos para una futura integración institucional.

No contiene una integración institucional terminada.

## Slide 19 — Cierre

> **UBO Academic Hub Release 1.0 entrega una base LMS funcional, inteligente y documentada, preparada para evolucionar hacia una integración institucional real cuando UBO proporcione sus fuentes y contratos oficiales.**
