# Base del backend inteligente

## Objetivo

`backend/` contiene una base Express aislada para la futura capa inteligente complementaria de UBO Academic Hub. Actualmente expone sólo `GET /api/health` y rutas vacías preparadas para evolución posterior.

## Alcance actual

- Express, CORS, carga de configuración por entorno, parseo JSON limitado, logger de solicitudes y manejo de errores básico.
- Health check: `GET http://localhost:3001/api/health` responde con el servicio y la arquitectura `intelligent-layer`.
- Rutas preparadas: autenticación, Tutor IA, recomendaciones, analítica, LMS e integración institucional.

## No administra

- Notas, matrículas o asistencia oficiales.
- PostgreSQL, ORM, migraciones ni otra persistencia.
- JWT, bcrypt, contraseñas reales o autenticación institucional efectiva.
- Reemplazo de los servicios demo ni migración de `localStorage`.

## Arquitectura

```text
backend/src
├── app.js        composición HTTP
├── server.js     entrada y puerto
├── config/       configuración no secreta
├── middleware/   logger y errores
├── routes/       fronteras futuras vacías
├── controllers/  reservado
├── services/     reservado
└── utils/        reservado
```

En fases posteriores, los conectores institucionales serán de lectura autorizada y los servicios propios de Hub manejarán Tutor, RAG, recomendaciones, analítica y LMS complementario. Cualquier integración real requiere contrato, autorización de servidor, minimización de datos y revisión de seguridad antes de implementarse.

## Uso local

```powershell
cd backend
npm install
npm start
```

No crear `.env` con secretos en el repositorio. Copiar `.env.example` localmente sólo cuando se requiera configuración distinta al puerto `3001`.
