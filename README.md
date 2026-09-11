# UBO Academic Hub

PWA académica demostrativa para centralizar la experiencia universitaria de la Universidad Bernardo O'Higgins. El proyecto muestra flujos aislados para estudiantes, profesores y administradores, conservando una aplicación principal independiente de la futura arquitectura institucional.

> Estado: demo funcional con datos simulados. No utiliza sistemas institucionales reales, autenticación productiva ni backend.

## Funcionalidades

- Dashboard académico del estudiante: ramos, calificaciones, asistencia, material, avisos, alertas y resumen académico.
- Herramientas de estudiante: simulador de notas y calculadora de asistencia.
- Panel docente: cursos, estudiantes, asistencia, notas, materiales y avisos.
- Panel administrativo: resumen institucional, gestión académica y analítica demo.
- Módulos demo institucionales: biblioteca, eventos, casino, pagos y emergencias.
- Progressive Web App con manifiesto, iconos y soporte offline básico mediante Service Worker.

## Tecnologías

- HTML5 y CSS3.
- JavaScript moderno con ES Modules.
- Service Worker y Web App Manifest.
- Datos y servicios demo en memoria; algunos flujos de la aplicación principal usan `localStorage` como persistencia temporal.

## Ejecución local

El proyecto es estático y debe servirse mediante un servidor HTTP local para que ES Modules y el Service Worker funcionen correctamente.

```powershell
cd "C:\Users\shari\Desktop\Ubo app academico"
python -m http.server 3000
```

Luego abrir [http://localhost:3000](http://localhost:3000). También puede utilizarse cualquier servidor estático equivalente.

## Usuarios demo

| Perfil | Usuario | Credencial demo | Acceso |
| --- | --- | --- | --- |
| Estudiante | Sofía Martínez Rojas | `sofia.martinez` / `demo123` | Aplicación principal |
| Profesor | Carlos Pérez | Selección demo | `modules/professor/teacher-dashboard.html` |
| Administrador | Administrador UBO | Selección demo | `modules/admin/admin-dashboard.html` |

Los perfiles docente y administrativo se abren desde el selector demo: `modules/demo/demo-selector.html`.

## Estructura

```text
.
├── index.html, app.js, styles.css       # Aplicación principal del estudiante
├── config/                              # Configuración institucional demo
├── core/                                # Infraestructura futura, aislada y no activada
├── data/                                # Datos, mappings y modelos demo
├── modules/                             # Interfaces por rol y módulos demo
├── services/                            # Consultas, acciones y adaptadores
├── tests/                               # Validaciones de regresión y arquitectura
├── docs/                                # Arquitectura, auditorías y decisiones
├── icons/                               # Iconos PWA
├── manifest.json                        # Metadatos de instalación
└── service-worker.js                    # Precache y soporte offline básico
```

## Seguridad y estado técnico

- Los renderizadores dinámicos priorizan nodos DOM y `textContent`; la auditoría de hardening XSS está documentada en `docs/AUDIT/`.
- La integración con UniEcosystemCore permanece aislada y desactivada: no se activan Core Session, Identity Canary, Career ni Room canónicos.
- El Service Worker vigente utiliza la caché `ubo-academic-hub-v145` y precachea `app.js?v=120`.

## Validación

Ejemplos de comprobaciones locales:

```powershell
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem tests -Filter *.test.js | ForEach-Object { node $_.FullName }
git diff --check
```

Las validaciones `npm test` y `npm run check` corresponden al repositorio separado de UniEcosystemCore cuando se trabaja con sus contratos.

## Limitaciones y próximos pasos

- Los datos, credenciales y métricas son demo.
- No existe backend, API institucional, autenticación real ni persistencia productiva.
- Antes de producción se requiere integrar fuentes institucionales reales, autorización de servidor, gestión de secretos, observabilidad y pruebas end-to-end en navegadores compatibles.

## Capturas

_Pendiente: añadir capturas verificadas de los flujos Student, Teacher y Admin antes de la publicación pública._

## Licencia

Proyecto académico/prototipo. Definir una licencia explícita antes de una publicación pública.
