# Arquitectura de integración institucional

La integración futura es de lectura controlada desde el sistema académico institucional hacia el backend de UBO Academic Hub. Hub no escribe datos oficiales en el ERP ni replica su modelo completo.

```text
Sistema institucional UBO
          │
          ▼
API institucional / adaptador autorizado
          │
          ▼
Backend UBO Academic Hub
          │
          ├── Tutor IA y RAG
          ├── Analítica derivada
          ├── Recomendaciones
          └── LMS y contenido propio
```

## Contrato de integración inicial

| Endpoint de Hub | Información solicitada | Uso permitido |
|---|---|---|
| `GET /integration/student/profile` | identidad académica mínima y carrera | personalización de perfil |
| `GET /integration/student/courses` | cursos oficiales y relación de matrícula | filtrar acceso a contenido LMS |
| `GET /integration/student/performance` | señales agregadas de rendimiento/autorizadas | riesgo, recomendaciones y tutoría |
| `GET /integration/courses/:id` | metadatos oficiales mínimos del curso | contexto de materiales, IA y analítica |

Estos endpoints representan un adaptador interno de Hub; el protocolo real, autenticación mutua, paginación y consentimiento se definirán junto al equipo institucional. No deben exponer contraseñas, respuestas de evaluaciones, información no necesaria ni datos de otros usuarios.

## Principios

- **Autoridad externa:** ERP/institución mantiene notas, matrículas y asistencia oficiales.
- **Lectura mínima:** sólo se obtiene lo necesario para el caso de uso solicitado.
- **Trazabilidad:** cada sincronización debe registrar fuente, fecha, versión de contrato y resultado.
- **Degradación segura:** si la integración falla, Hub no inventa resultados ni modifica información académica oficial.
- **Aislamiento:** los datos propios de LMS, tutor y RAG permanecen bajo el backend de Hub con sus políticas de retención.
