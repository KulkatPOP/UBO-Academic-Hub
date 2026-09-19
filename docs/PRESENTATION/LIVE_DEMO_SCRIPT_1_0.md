# Guion de demostración en vivo — Release 1.0

## Preparación

1. Desde `backend/`, instalar dependencias y levantar PostgreSQL local:

   ```powershell
   npm install
   docker compose up -d postgres
   npm run db:migrate
   npm run db:seed
   npm start
   ```

2. Verificar API y base local:

   ```powershell
   Invoke-WebRequest http://localhost:3001/api/health -UseBasicParsing
   Invoke-WebRequest http://localhost:3001/api/database/health -UseBasicParsing
   ```

3. Desde la raíz, levantar frontend en otra terminal:

   ```powershell
   python -m http.server 3000
   ```

4. Abrir `http://localhost:3000` en un navegador. Verificar que el navegador permita cookies locales y que frontend/API estén disponibles.

> Las credenciales siguientes son exclusivamente DEMO. No corresponden a cuentas institucionales UBO.

## Demo Student

**Usuario:** `msofia`
**Contraseña:** `123456`

1. Ingresar y confirmar el dashboard Student.
2. Abrir **Mis Ramos**.
3. Elegir **Bases de Datos**.
4. En Course Detail, mostrar materiales, progreso y asistencia LMS disponibles.
5. Mostrar la sección de inteligencia: explicar que usa evidencia LMS local y puede declarar `INSUFFICIENT_DATA`.
6. Mostrar la recomendación cuando exista: debe apuntar a un recurso LMS autorizado, por ejemplo **Clave primaria**.
7. Abrir Tutor, formular una pregunta relacionada al curso y mostrar la fuente/contexto local cuando esté disponible.
8. Cerrar sesión.

No presentar datos DEMO como datos UBO oficiales y no afirmar predicción de rendimiento.

## Demo Teacher

**Usuario:** `pcarlos`
**Contraseña:** `123456`

1. Ingresar y mostrar Dashboard Teacher.
2. Abrir **Mis Cursos** y elegir **Bases de Datos**.
3. Mostrar estudiantes, materiales, evaluaciones, asistencia, avisos y analítica disponibles para el curso propio.
4. Explicar que el backend controla rol y pertenencia del curso.
5. Cerrar sesión.

## Demo Admin

**Usuario:** `admin`
**Contraseña:** `admin123`

1. Ingresar y abrir el overview Admin.
2. Mostrar métricas agregadas del LMS.
3. Recordar que no se exponen contenidos privados de Student ni mensajes individuales desde el overview.
4. Cerrar sesión.

## Cierre de la demo

- Resumir que el LMS actual es local y DEMO.
- Diferenciar claramente la arquitectura lista para evolucionar de una integración UBO aún no realizada.
- Indicar que SSO, fuentes oficiales y sincronización requieren contratos y datos proporcionados por UBO.
