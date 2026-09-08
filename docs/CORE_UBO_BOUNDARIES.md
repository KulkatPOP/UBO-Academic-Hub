# Fronteras técnicas: UniEcosystemCore / UboAcademicHub

## 1. Resumen

No se separó físicamente ningún proyecto. La frontera recomendada es: **UniEcosystemCore** aporta contratos, casos de uso y puertos reutilizables; **UboAcademicHub** aporta composición, experiencia UBO, configuración, datos e integraciones institucionales. Los fixtures DEMO no son Core.

## 2. Principios

- Core no conoce UBO, DOM, PWA, rutas institucionales, \`localStorage\` ni fixtures.
- UBO no duplica modelos, validaciones ni servicios genéricos.
- Los adapters traducen formatos en la frontera institucional.
- Las migraciones deben ser de solo lectura, reversibles y protegidas por flags mientras exista el shell legacy.
- “Configurable para UBO” no equivale a “Core puro”.

## 3. Definición de Core

| Componente actual | Función | Dependencia actual | Clasificación | Transformación / destino |
| --- | --- | --- | --- | --- |
| \`data/models/user-model.js\` | Contrato User | Ninguna | CORE-PURO | \`domain/models\` |
| \`student-model.js\`, \`teacher-model.js\` | Identidad académica | Ninguna | CORE-PURO | \`domain/models\` |
| \`career-model.js\`, \`room-model.js\`, \`schedule-model.js\` | Contratos con validación | Catálogos pendientes | CORE-PURO | Modelos; catálogos por puerto |
| \`enrollment-model.js\`, \`evaluation-model.js\` | Relaciones académicas | Estados requieren aprobación | CORE-CON-DESACOPLAMIENTO | Enums/políticas inyectables |
| \`course-model.js\`, \`grade-model.js\`, \`attendance-model.js\`, \`material-model.js\` | Contratos académicos | Ninguna | CORE-CON-DESACOPLAMIENTO | Endurecer invariantes sin datos UBO |
| \`core/permissions.js\` | RBAC básico | Roles hardcodeados | CORE-CON-DESACOPLAMIENTO | Policy provider configurable |
| \`core/session.js\` | Sesión en memoria | Ninguna | CORE-CON-DESACOPLAMIENTO | Port de sesión |
| \`core/router.js\` | Ruta por rol | Rutas UBO/demo | CONFIG | Registro de rutas institucional |
| Adaptadores canónicos | Transformación | Mappings UBO en algunos casos | CORE-CON-DESACOPLAMIENTO | Core conserva interfaz; UBO implementa mapping |

Core expone contratos, validadores, casos de uso y puertos. Nunca debe conocer Universidad Bernardo O’Higgins, IDs UBO, carreras, HTML/CSS, PWA, credenciales demo ni claves de almacenamiento.

## 4. Definición de UBO

Son UBO CUSTOM: \`index.html\`, \`styles.css\`, \`app.js\`, \`manifest.json\`, \`service-worker.js\`, \`icons/\`, textos institucionales, pantallas y rutas actuales. También pertenecen aquí campus, DAE, biblioteca UBO, correo, certificados, vida universitaria, reglas \`@pregrado.ubo.cl\`, periodos, salas, carreras, copy y compatibilidad actual.

Los módulos Profesor y Admin son ejemplos funcionales UBO: su patrón UI puede inspirar componentes futuros, pero sus datos, etiquetas, rutas y composición no son genéricos.

## 5. Configuración

| Valor actual | Archivo / zona | Estado | Configuración futura |
| --- | --- | --- | --- |
| Universidad Bernardo O’Higgins / UBO | \`index.html\`, \`app.js\`, manifest | HARDCODED | \`institution.name\`, \`shortName\` |
| Logo, iconos, azul institucional | HTML, CSS, \`icons/\` | HARDCODED | paquete branding/theme |
| Rutas de roles demo | \`core/router.js\`, demo-router | HARDCODED | route registry institucional |
| Roles base | \`core/permissions.js\` | YA CONFIGURABLE parcialmente | policies/roles config |
| Flags Career y Room | \`app.js\` | HARDCODED | feature-flag provider |
| Campus, carreras, salas, periodos | \`data/university/\`, \`app.js\` | DEMO | fuente institucional |
| Login y correo institucional | \`app.js\` | HARDCODED | auth adapter + policy |
| PWA/cache | manifest/service worker | UBO | configuración de app shell |

## 6. Datos institucionales

\`data/university/\` es **DATA-INSTITUTIONAL / DEMO**: analytics, attendance, careers, casino, courses, emergencies, events, grades, library, materials, payments, rooms y schedules. No debe pasar al Core como fuente productiva. Cada archivo terminará como fixture de examples/tests, adapter de una fuente UBO o integración institucional.

\`data/users.js\`, \`data/students.js\`, \`data/professors.js\`, \`data/courses.js\` y \`data/mappings/\` son datos/transición UBO. Los mappings viven junto al adapter, no definen el modelo canónico.

## 7. Dependencias

| Componente | Dependencia | Problema | Solución futura |
| --- | --- | --- | --- |
| Course/Student/Professor/Admin services | \`data/university/\`, \`data/users.js\` | Fuente DEMO concreta | Repository ports UBO |
| Biblioteca/Eventos/Casino/Pagos/Emergencias | Fixtures UBO | Servicio genérico contaminado | Contrato + adapter UBO |
| \`modules/professor/dashboard.js\` | Salas y horarios UBO directos | UI conoce fixtures | View-model/use case inyectado |
| \`core/router.js\` | Rutas UBO | Core conoce topología UBO | Registro de rutas |
| \`app.js\` | DOM, PWA, localStorage, datos UBO | Legacy monolítico | Façade / bridges |
| Actions docentes y de servicios | Políticas y fuente DEMO | Validación no portable | Policies + repositories por puerto |

No se observaron dependencias Core hacia credenciales reales ni APIs reales.

## 8. app.js

| Bloque | Clasificación | Razón | Destino futuro |
| --- | --- | --- | --- |
| Login, sesión y recordar usuario | LEGACY / UBO | Usuarios demo y claves \`ubo*\` | auth adapter |
| Navegación y render | LEGACY | DOM y stack local | app shell UBO |
| Dashboard, perfil, alertas, correo | UBO | Copy/componentes UBO | módulos UBO |
| Cursos, horario, notas, asistencia | LEGACY + DATA | Datos embebidos | adapters a Core |
| Eventos, biblioteca, pagos, DAE | UBO | Catálogos/copy UBO | módulos/integraciones UBO |
| Branding, RUT y campus | UBO | Institución específica | config/datos |
| Simuladores | LEGACY | Regla local y UI | caso de uso Core futuro |

No debe extraerse \`app.js\` masivamente; cada lectura debe pasar primero por un bridge reversible.

## 9. Servicios

- **Genéricos con desacoplamiento:** Career, Room y Schedule; expresan lectura canónica pero importan fixtures/adapters UBO.
- **Genéricos contaminados por DEMO:** Course, Student, Professor, Admin, Attendance, Grade y Material.
- **UBO / examples:** Library, Event, Casino, Payment y Emergency, por sus catálogos y datos UBO.
- **Ports pendientes:** auth-service, api-client y storage son placeholders; deben evolucionar a interfaces.

## 10. Modelos

User, Student, Teacher, Career, Course, Enrollment, Room, Schedule, Evaluation, Grade, Attendance y Material no contienen datos UBO y son candidatos Core. Permanecen decisiones institucionales: estados, escala de notas, periodos, calendario, retención y política de asistencia. No deben aparecer como defaults UBO en los modelos.

## 11. Modules

\`modules/demo/\` es **example/test UBO**, no Core productivo: selector, previews de migración y demos de biblioteca, eventos, casino, pagos y emergencias. A futuro puede vivir en \`examples/ubo\`. \`modules/student/dashboard.js\` es placeholder. Profesor/Admin son UBO CUSTOM hasta que existan view-models y UI desacoplados de datos institucionales. No se elimina nada en esta fase.

## 12. Contrato Core / UBO

\`\`\`text
UniEcosystemCore
  domain + application + contracts/ports
              ↓
  adapters institucionales UBO
              ↓
  UboAcademicHub: app shell, branding, módulos, PWA
              ↓
  datos UBO / identidad / sistemas académicos / notificaciones
\`\`\`

Core recibe repositories, configuración y políticas; UBO los implementa y compone UI. Adapters viven en la aplicación institucional; fixtures, mappings y branding no viven en Core.

## 13. No duplicación

| Elemento | Mecanismo recomendado |
| --- | --- |
| Modelos y validaciones | PACKAGE / dependency versionada |
| Casos de uso y permisos | PACKAGE + policies |
| Datos y mappings | ADAPTER institucional |
| Branding, módulos y rutas | CONFIGURATION |
| UI reusable | PACKAGE o workspace compartido |
| Integraciones externas | PLUGIN / adapter |
| PWA e infraestructura | AcademicHub por institución |

## 14. Multiuniversidad

Se mantiene **Core + AcademicHub por institución**. Da mejor aislamiento, personalización, rollback y seguridad en la etapa actual. Multi-tenant es prematuro sin backend, tenancy, IAM, auditoría y segregación de datos. Un híbrido se evalúa solo con varias instituciones y contratos estabilizados.

## 15. Versionado

Usar SemVer: v1 para contratos estables; v1.1 para capacidades compatibles; v2 para rupturas. Cada cambio requiere changelog, tests de compatibilidad, guía de migración y rollback. AcademicHub fija rango de compatibilidad y no consume cambios mayores automáticamente.

## 16. Seguridad

La app contiene credenciales, identificadores tipo RUT, correos y usuarios marcados DEMO; no son aptos para producción ni para migrar al Core. No se identificaron secretos, API keys ni tokens con valores expuestos. Qodana referencia un secreto de GitHub, no su valor. Integración real requerirá IAM, backend, gestión de secretos, auditoría y retención. Esta clasificación es técnica, no legal.

## 17. Propiedad técnica

- **CORE REUTILIZABLE:** contratos, dominio, casos de uso, puertos y validadores.
- **UBO CUSTOM:** shell, experiencia, módulos compuestos, PWA y branding.
- **DATA INSTITUCIONAL:** catálogos, identidad, académico, mappings y analítica.
- **THIRD-PARTY / INFRASTRUCTURE:** Qodana, GitHub Actions y futuras APIs.

## 18. Arquitectura objetivo

\`\`\`text
UniEcosystemCore/
  contracts/ domain/ application/ ports/ permissions/ shared/ tests/
UboAcademicHub/
  app/ config/ branding/ institutional-data/ adapters/ modules/ pwa/ legacy/
\`\`\`

Es una meta conceptual, no una estructura para aplicar todavía.

## 19. Orden de separación

1. Configuración y branding: bajo riesgo.
2. Datos y mappings: implementaciones UBO con copias defensivas.
3. Adapters read-only: flags y fallback legacy.
4. Servicios/casos de uso: ports antes de reemplazar fuentes.
5. Modelos: cuando decisiones institucionales estén aprobadas.
6. UI por vista aislada: nunca reescribir dashboard masivamente.
7. App shell, PWA y legacy: último, tras regresión completa.

## 20. Checklist

- [ ] Core sin datos UBO
- [ ] Core sin branding UBO
- [ ] Core sin credenciales UBO
- [ ] Core sin dependencias de \`data/university\`
- [ ] Core sin imports desde \`app.js\`
- [ ] Adapters institucionales aislados
- [ ] Configuración institucional externa
- [ ] Datos institucionales externos
- [ ] Tests Core independientes
- [ ] UboAcademicHub consume Core
- [ ] Documentación actualizada
- [ ] CI/CD separado
- [ ] Versionado definido
- [ ] Estrategia rollback definida
- [ ] Seguridad revisada

## 21. Riesgos

Mover archivos antes de tener ports, compartir \`localStorage\` entre Core y UBO, tratar fixtures como fuente institucional, duplicar modelos por app y convertir rutas/config UBO en constantes Core son los riesgos principales. También lo es asumir escalas de nota, asistencia o estados académicos universales sin aprobación.

## 22. Recomendaciones

No separar físicamente todavía. La siguiente fase segura es definir contracts de repositories/configuration y migrar una lectura piloto mediante adapter con fallback, pruebas independientes y rollback. No migrar autenticación, PWA ni \`app.js\` hasta estabilizar esos ports.

### Avance Fase 1.13

La configuración pasiva de UBO reside ahora en \`config/institution.js\`: identidad visible, dominio de correo institucional, branding ya existente, referencia de campus, flags canónicos desactivados y referencia PWA. No contiene datos académicos, sesión, DOM, almacenamiento ni APIs. El shell visual, \`manifest.json\`, service worker, datos DEMO y textos estáticos HTML permanecen temporalmente hardcoded del lado UBO; no deben entrar al Core.
