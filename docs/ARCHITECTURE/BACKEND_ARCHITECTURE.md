# Backend de UBO Academic Hub

El backend propio es el límite de la plataforma complementaria. No administra la universidad completa ni sustituye al ERP académico.

## Responsabilidades

- Autenticación propia de plataforma y, posteriormente, autenticación federada.
- Conectores/adaptadores hacia APIs institucionales autorizadas.
- Lógica LMS propia: contenidos, actividades y mensajería de la plataforma.
- Tutor IA, recuperación RAG, historial conversacional y recomendaciones explicables.
- Analítica derivada y preferencias/configuraciones de Hub.
- Almacenamiento y auditoría de datos generados por la plataforma.

## Fuera de alcance

- Registrar o modificar notas oficiales.
- Administrar matrícula oficial, carreras, horarios o asistencia oficial.
- Reemplazar ERP, biblioteca institucional, finanzas institucionales o sistemas de recursos humanos.
- Usar al frontend como fuente de autorización.

## Componentes objetivo

```text
API Gateway / BFF
├── Identity & federación
├── Integration adapters (institución)
├── LMS domain
├── Intelligence domain (Tutor, RAG, recomendaciones, analítica)
├── Persistence Hub (PostgreSQL + objetos)
└── Audit / observabilidad
```

El BFF entrega contratos adecuados para la PWA. Los adaptadores encapsulan peculiaridades del sistema institucional para que Tutor, analítica y LMS no dependan de un proveedor específico.
