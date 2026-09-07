# Roadmap de desarrollo

## 1. Integración gradual de estudiante

- Consolidar los mapas de equivalencias como fuente aprobada.
- Completar los datos institucionales que aún aparecen como `planned`.
- Validar perfil, cursos y horarios en modo solo lectura.
- Implementar sincronización en sombra antes de sustituir cualquier fuente de datos de la PWA.
- Migrar cada dominio con fallback y pruebas independientes.

## 2. Panel Profesor completo

- Conectar la identidad docente a sesión y permisos reales.
- Incorporar matrícula y lista de alumnos por curso.
- Integrar asistencia, evaluaciones, notas y materiales mediante servicios institucionales.
- Añadir autorización por curso, registro de acciones y comunicación académica.

## 3. Panel Administrador completo

- Consolidar estadísticas en una fuente de datos única.
- Incorporar gestión de usuarios, carreras, cursos, salas y horarios.
- Implementar gestión de permisos con trazabilidad.
- Añadir reportes institucionales, auditoría y métricas operativas.

## 4. Servicios universitarios

La expansión debe reutilizar modelos, servicios, permisos y contratos comunes antes de crear nuevas interfaces.

Prioridades futuras:

- Biblioteca y préstamos.
- Casino y servicios de alimentación.
- Pagos, matrícula y comprobantes.
- Eventos y actividades universitarias.
- Emergencias y comunicaciones institucionales.

Cada servicio debe definir propietario de datos, permisos, persistencia, estados vacíos, trazabilidad y fallback antes de integrarse en los dashboards existentes.
